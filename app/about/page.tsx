"use client"


import Image from "next/image"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/providers/language-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, MessageCircle, Star, Bookmark, Users, Globe2, Sparkles } from "lucide-react"


export default function AboutPage() {
 const { content } = useLanguage()
 const router = useRouter()
 const about = content.about || {}


 return (
   <div className="min-h-[calc(100vh-5rem)] relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-purple-950/40 dark:to-indigo-950/40">
     {/* Background gradients */}
     <div className="pointer-events-none absolute inset-0 -z-10">
       <div className="absolute -top-20 -left-10 h-64 w-64 rounded-full bg-purple-300/25 blur-3xl dark:bg-purple-700/30" />
       <div className="absolute top-40 -right-10 h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl dark:bg-indigo-700/30" />
       <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-pink-300/20 blur-3xl dark:bg-pink-700/25" />
     </div>


     <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
       {/* Hero Section */}
       <section className="grid gap-8 md:grid-cols-[1.4fr,1fr] items-center">
         <div className="space-y-5">
           <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-purple-700 shadow-sm ring-1 ring-purple-100 dark:bg-gray-900/80 dark:text-purple-200 dark:ring-purple-900/60">
             <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
             <span>{about.hero?.badge}</span>
           </div>
           <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
             {about.hero?.title}
           </h1>
           <p className="text-base sm:text-lg font-medium text-purple-800 dark:text-purple-200">
             {about.hero?.subtitle}
           </p>
           <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
             {about.hero?.description}
           </p>
         </div>


         <div className="relative flex justify-center md:justify-end">
           <div className="relative w-48 h-48 sm:w-56 sm:h-56">
             <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-purple-400/40 via-pink-400/40 to-indigo-400/40 blur-2xl" />
             <Card className="relative h-full w-full overflow-hidden rounded-3xl bg-white/90 shadow-xl dark:bg-gray-900/90 border border-white/60 dark:border-purple-900/50">
               <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-4">
                 <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 p-1 shadow-lg">
                   <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-gray-900">
                     <Image
                       src="/elephant-mascot.png"
                       alt="Course D Tell Me mascot"
                       width={96}
                       height={96}
                       className="h-20 w-20 object-contain"
                     />
                   </div>
                 </div>
                 <p className="text-xs text-center text-slate-600 dark:text-slate-300">
                   {about.hero?.mascotCaption}
                 </p>
               </CardContent>
             </Card>
           </div>
         </div>
       </section>


       {/* What is & Why Section */}
       <section className="grid gap-6 md:grid-cols-2">
         <Card className="bg-white/90 dark:bg-gray-900/90 border border-purple-100/70 dark:border-purple-900/60 shadow-md hover:shadow-lg transition-all duration-300">
           <CardContent className="p-5 space-y-4">
             <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
               <GraduationCap className="h-5 w-5 text-purple-500" />
               {about.whatIs?.title}
             </h2>
             <p className="text-sm text-slate-600 dark:text-slate-300">
               {about.whatIs?.description}
             </p>
             <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
               <li className="flex items-start gap-2">
                 <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                 <span>{about.whatIs?.bullets?.reviews}</span>
               </li>
               <li className="flex items-start gap-2">
                 <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                 <span>{about.whatIs?.bullets?.qa}</span>
               </li>
               <li className="flex items-start gap-2">
                 <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                 <span>{about.whatIs?.bullets?.ratings}</span>
               </li>
               <li className="flex items-start gap-2">
                 <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                 <span>{about.whatIs?.bullets?.bookmarks}</span>
               </li>
             </ul>
           </CardContent>
         </Card>


         <Card className="bg-white/90 dark:bg-gray-900/90 border border-purple-100/70 dark:border-purple-900/60 shadow-md hover:shadow-lg transition-all duration-300">
           <CardContent className="p-5 space-y-4">
             <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
               <MessageCircle className="h-5 w-5 text-indigo-500" />
               {about.why?.title}
             </h2>
             <p className="text-sm text-slate-600 dark:text-slate-300">
               {about.why?.problems}
             </p>
             <p className="text-sm text-slate-600 dark:text-slate-300">
               {about.why?.solution}
             </p>
           </CardContent>
         </Card>
       </section>


       {/* Key Features Section */}
       <section className="space-y-4">
         <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
           <Sparkles className="h-5 w-5 text-purple-500" />
           {about.features?.title}
         </h2>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <Card className="group bg-white/95 dark:bg-gray-900/95 border border-purple-100/70 dark:border-purple-900/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
             <CardContent className="p-4 space-y-2">
               <div className="flex items-center justify-between">
                 <div className="rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200 p-2">
                   <Star className="h-4 w-4" />
                 </div>
               </div>
               <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                 {about.features?.cards?.reviews?.title}
               </h3>
               <p className="text-xs text-slate-600 dark:text-slate-300">
                 {about.features?.cards?.reviews?.description}
               </p>
             </CardContent>
           </Card>


           <Card className="group bg-white/95 dark:bg-gray-900/95 border border-purple-100/70 dark:border-purple-900/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
             <CardContent className="p-4 space-y-2">
               <div className="rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200 p-2 inline-flex">
                 <Users className="h-4 w-4" />
               </div>
               <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                 {about.features?.cards?.anonymous?.title}
               </h3>
               <p className="text-xs text-slate-600 dark:text-slate-300">
                 {about.features?.cards?.anonymous?.description}
               </p>
             </CardContent>
           </Card>


           <Card className="group bg-white/95 dark:bg-gray-900/95 border border-purple-100/70 dark:border-purple-900/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
             <CardContent className="p-4 space-y-2">
               <div className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 p-2 inline-flex">
                 <Globe2 className="h-4 w-4" />
               </div>
               <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                 {about.features?.cards?.translation?.title}
               </h3>
               <p className="text-xs text-slate-600 dark:text-slate-300">
                 {about.features?.cards?.translation?.description}
               </p>
             </CardContent>
           </Card>


           <Card className="group bg-white/95 dark:bg-gray-900/95 border border-purple-100/70 dark:border-purple-900/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
             <CardContent className="p-4 space-y-2">
               <div className="rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200 p-2 inline-flex">
                 <Bookmark className="h-4 w-4" />
               </div>
               <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                 {about.features?.cards?.insights?.title}
               </h3>
               <p className="text-xs text-slate-600 dark:text-slate-300">
                 {about.features?.cards?.insights?.description}
               </p>
             </CardContent>
           </Card>
         </div>
       </section>


       {/* Who can use & Vision */}
       <section className="grid gap-6 md:grid-cols-2">
         <Card className="bg-white/90 dark:bg-gray-900/90 border border-purple-100/70 dark:border-purple-900/60 shadow-md hover:shadow-lg transition-all duration-300">
           <CardContent className="p-5 space-y-4">
             <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
               <Users className="h-5 w-5 text-purple-500" />
               {about.whoCanUse?.title}
             </h2>
             <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
               <div>
                 <p className="font-semibold text-slate-900 dark:text-slate-50">
                   {about.whoCanUse?.cmu?.title}
                 </p>
                 <p className="text-xs sm:text-sm">
                   {about.whoCanUse?.cmu?.description}
                 </p>
               </div>
               <div>
                 <p className="font-semibold text-slate-900 dark:text-slate-50">
                   {about.whoCanUse?.google?.title}
                 </p>
                 <p className="text-xs sm:text-sm">
                   {about.whoCanUse?.google?.description}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>


         <Card className="bg-white/90 dark:bg-gray-900/90 border border-purple-100/70 dark:border-purple-900/60 shadow-md hover:shadow-lg transition-all duration-300">
           <CardContent className="p-5 space-y-3">
             <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
               <GraduationCap className="h-5 w-5 text-indigo-500" />
               {about.vision?.title}
             </h2>
             <p className="text-sm text-slate-600 dark:text-slate-300">
               {about.vision?.description}
             </p>
             <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
               {about.vision?.emphasis}
             </p>
           </CardContent>
         </Card>
       </section>


       {/* CTA Section */}
       <section className="mt-4 mb-2">
         <Card className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-xl border-none rounded-3xl">
           <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 sm:p-7">
             <div className="space-y-2 text-center md:text-left">
               <h2 className="text-lg sm:text-xl font-semibold">
                 {about.cta?.title}
               </h2>
             </div>
             <Button
               size="lg"
               onClick={() => router.push("/")}
               className="rounded-full bg-white text-purple-700 hover:bg-purple-50 px-6 sm:px-8 py-2 font-semibold shadow-md hover:shadow-xl transition-all duration-300 flex items-center gap-2"
             >
               <span>{about.cta?.button}</span>
             </Button>
           </CardContent>
         </Card>
       </section>
     </div>
   </div>
 )
}







