import axios from "axios";
import { cookies } from 'next/headers'
import jwt from "jsonwebtoken";
import  { NextRequest, NextResponse } from "next/server";
import { CmuEntraIDBasicInfo } from "@/types/CmuEntraIDBasicInfo";

type SuccessResponse = {
  ok: true;
};

type ErrorResponse = {
  ok: false;
  message: string;
};

export type SignInResponse = SuccessResponse | ErrorResponse;

// //Can view occur at each step of the process, such as before sending a request, after receiving a response, or when an error occurs.
// axios.interceptors.request.use(req=>{
//   console.log((req));
//   return req
// })

//get EntraIDtoken 
async function getEmtraIDAccessTokenAsync(
  authorizationCode: string
): Promise<string | null> {
  try {
    const tokenUrl = process.env.CMU_ENTRAID_GET_TOKEN_URL as string;
    const redirectUrl = process.env.CMU_ENTRAID_REDIRECT_URL as string;
    const clientId = process.env.CMU_ENTRAID_CLIENT_ID as string;
    const clientSecret = process.env.CMU_ENTRAID_CLIENT_SECRET as string;
    const scope = process.env.SCOPE as string;

    if (!tokenUrl || !redirectUrl || !clientId || !clientSecret || !scope) {
      console.error("Missing EntraID configuration:", {
        hasTokenUrl: !!tokenUrl,
        hasRedirectUrl: !!redirectUrl,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasScope: !!scope,
      });
      return null;
    }

    const response = await axios.post(
      tokenUrl,
      {
        code: authorizationCode,
        redirect_uri: redirectUrl,
        client_id: clientId,
        client_secret: clientSecret,
        scope: scope,
        grant_type: "authorization_code",
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    ); 

    return response.data.access_token;    
  } catch (error: any) {
    console.error("Error getting EntraID access token:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });
    return null;
  }
}

async function getCMUBasicInfoAsync(accessToken: string) {
  try {
    const besicinfoUrl = process.env.CMU_ENTRAID_GET_BASIC_INFO as string;
    if (!besicinfoUrl) {
      console.error("Missing CMU_ENTRAID_GET_BASIC_INFO environment variable");
      return null;
    }
    const response = await axios.get(
      besicinfoUrl,
      {
        headers: { Authorization: "Bearer " + accessToken },
      }
    );
    return response.data as CmuEntraIDBasicInfo;
  } catch (err: any) {
    console.error("Error getting CMU basic info:", {
      message: err?.message,
      response: err?.response?.data,
      status: err?.response?.status,
    });
    return null;
  }
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<SignInResponse>> {
  const { authorizationCode } = await req.json();
  
  if (!authorizationCode)
    return NextResponse.json({ ok: false, message: "Invalid authorization code" }, { status: 400 });   

  if (typeof authorizationCode !== "string")
    return NextResponse.json({ ok: false, message: "Invalid authorization code" }, { status: 400 });    
  
  //get access token from EntraID
  const accessToken = await getEmtraIDAccessTokenAsync(authorizationCode);
  if (!accessToken)
     return NextResponse.json({ ok: false, message:  "Cannot get EntraID access token" }, { status: 400 });    

  //get basic info
   const cmuBasicInfo = await getCMUBasicInfoAsync(accessToken);
 
  if (!cmuBasicInfo)
    return NextResponse.json({ ok: false, message: "Cannot get cmu basic info" }, { status: 400 });   

  //Code related to CMU EntraID ends here.
  //The rest code is just an example of how you can use CMU basic info to create session
  //if the code reach here, it means that user sign-in using his CMU Account successfully
  //Now we will use acquired baic info (student name, student id, ...) to create session
  //There are many authentication methods such as token or cookie session or you can use any authentication library.
  //The example will use JsonWebToken (JWT)

  if (typeof process.env.JWT_SECRET !== "string")
    throw "Please assign jwt secret in .env!";

  const token = jwt.sign(
    {
      cmuitaccount_name: cmuBasicInfo.cmuitaccount_name,
      cmuitaccount: cmuBasicInfo.cmuitaccount,
      student_id: cmuBasicInfo.student_id,
      prename_id: cmuBasicInfo.prename_id,
      prename_TH: cmuBasicInfo.prename_TH,
      prename_EN: cmuBasicInfo.prename_EN,
      firstname_TH: cmuBasicInfo.firstname_TH,
      firstname_EN: cmuBasicInfo.firstname_EN,
      lastname_TH: cmuBasicInfo.lastname_TH,
      lastname_EN: cmuBasicInfo.lastname_EN,
      organization_code: cmuBasicInfo.organization_code,
      organization_name_TH: cmuBasicInfo.organization_name_TH,
      organization_name_EN: cmuBasicInfo.organization_name_EN,
      itaccounttype_id: cmuBasicInfo.itaccounttype_id,
      itaccounttype_TH:  cmuBasicInfo.itaccounttype_TH,
      itaccounttype_EN: cmuBasicInfo.itaccounttype_EN //Note that not everyone has this. Teachers and CMU Staffs don't have student id!
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h", // Token will last for one hour only
    }
  );
  
  //This apptoken not EntraIDtoken.
  //Write token in cookie storage of client's browser
  //Note that this is server side code. We can write client cookie from the server. This is normal.
  //You can view cookie in the browser devtools (F12). Open tab "Application" -> "Cookies"
  const cookieStore = await cookies();
  const cookieOptions: any = {
    name : "cmu-entraid-example-token",
    value: token,
    maxAge: 3600,
    //Set httpOnly to true so that client JavaScript cannot read or modify token
    //And the created token can be read by server side only
    httpOnly: true,
    sameSite: "lax",
    //force cookie to use HTTPS only in production code
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  
  // Only set domain for localhost in development
  // In production, omit domain to let browser set it automatically
  if (process.env.NODE_ENV === "development") {
    cookieOptions.domain = "localhost";
  }
  
  cookieStore.set(cookieOptions);
  return NextResponse.json({ ok: true});
}

export async function GET() {
  try {
    const clientId = process.env.CMU_ENTRAID_CLIENT_ID;
    const redirectUri = process.env.CMU_ENTRAID_REDIRECT_URL;
    const scope = process.env.SCOPE;
    
    if (!clientId || !redirectUri || !scope) {
      throw new Error('Missing OAuth configuration');
    }

    // Use the Microsoft login URL instead
    const authUrl = `https://login.microsoftonline.com/cf81f1df-de59-4c29-91da-a2dfd04aa751/oauth2/v2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=xyz`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('OAuth initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize OAuth' },
      { status: 500 }
    );
  }
}
