import { cookies } from 'next/headers'
import jwt from "jsonwebtoken";
import  { NextRequest, NextResponse } from "next/server";
import { JWTPayload } from "@/types/JWTPayload";

type SuccessResponse = {
  ok: true;
  cmuBasicInfo: JWTPayload[];
};

type ErrorResponse = {
  ok: false;
  message: string;
};

export type WhoAmIResponse = SuccessResponse | ErrorResponse;

export async function GET(
  req: NextRequest,
): Promise<NextResponse<WhoAmIResponse>> {

  //This token means apptoke
  const cookieStore = await cookies();
  const token = cookieStore.get('cmu-entraid-example-token')?.value;
  const tokenSecret = process.env.JWT_SECRET as string;
  //validate token
  if (typeof token !== "string")
    return NextResponse.json({ ok: false, message: "Invalid token" }, { status: 401 }); 

  try {
    const decoded = jwt.verify(
      token,
      tokenSecret
    ) as JWTPayload;

    return NextResponse.json({
      ok: true,
      cmuBasicInfo:[{
      cmuitaccount_name: decoded.cmuitaccount_name,
      cmuitaccount: decoded.cmuitaccount,
      student_id: decoded.student_id,
      prename_id: decoded.prename_id,
      prename_TH: decoded.prename_TH,
      prename_EN: decoded.prename_EN,
      firstname_TH: decoded.firstname_TH,
      firstname_EN: decoded.firstname_EN,
      lastname_TH: decoded.lastname_TH,
      lastname_EN: decoded.lastname_EN,
      organization_code: decoded.organization_code,
      organization_name_TH: decoded.organization_name_TH,
      organization_name_EN: decoded.organization_name_EN,
      itaccounttype_id: decoded.itaccounttype_id,
      itaccounttype_TH: decoded.itaccounttype_TH,
      itaccounttype_EN: decoded.itaccounttype_EN
      }]
    });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Invalid token" }, { status: 401 });   
  }

}
