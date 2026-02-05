"use client"


import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, StarHalf, Trophy, Medal, Award, Users, ChevronRight } from "lucide-react"
import {
 Carousel,
 CarouselContent,
 CarouselItem,
 CarouselNext,
 CarouselPrevious,
} from "@/components/ui/carousel"


export interface TopReviewedCourse {
 courseId: string
 courseName: string
 faculty: string
 averageRating: number
 totalReviews: number
 rank: number
}


export function TopReviewedCourses() {
 const [courses, setCourses] = useState<TopReviewedCourse[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const router = useRouter()


 useEffect(() => {
   const fetchTopCourses = async () => {
     try {
       setIsLoading(true)
       setError(null)
       const response = await fetch('/api/courses/top-reviewed')
      
       if (!response.ok) {
         throw new Error('Failed to fetch top reviewed courses')
       }
      
       const data = await response.json()
       if (data.success) {
         setCourses(data.courses)
       } else {
         throw new Error(data.error || 'Failed to fetch courses')
       }
     } catch (err) {
       console.error('Error fetching top reviewed courses:', err)
       setError(err instanceof Error ? err.message : 'Unknown error')
     } finally {
       setIsLoading(false)
     }
   }


   fetchTopCourses()
 }, [])


 const getRankIcon = (rank: number) => {
   // Large, bold ranking number (1–10) only
   return (
     <span
       className={
         "text-xl sm:text-2xl font-black leading-none tracking-tight " +
         (rank === 1
           ? "text-yellow-50"
           : rank === 2
           ? "text-gray-900"
           : rank === 3
           ? "text-amber-50"
           : "text-gray-800 dark:text-gray-100")
       }
     >
       {rank}
     </span>
   )
 }


 const getRankBadgeColor = (rank: number) => {
   switch (rank) {
     case 1:
       return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
     case 2:
       return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
     case 3:
       return "bg-gradient-to-r from-amber-500 to-amber-700 text-white"
     default:
       return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
   }
 }


 const renderStars = (rating: number) => {
   const maxStars = 5
   const fullStars = Math.floor(rating)
   const hasHalfStar = rating - fullStars >= 0.5


   return (
     <div className="flex items-center gap-1.5 text-amber-500">
       {Array.from({ length: maxStars }).map((_, index) => {
         if (index < fullStars) {
           return <Star key={index} className="w-5 h-5 fill-amber-400 text-amber-400" />
         }
         if (index === fullStars && hasHalfStar) {
           return <StarHalf key={index} className="w-5 h-5 fill-amber-400 text-amber-400" />
         }
         return <Star key={index} className="w-5 h-5 text-gray-300 dark:text-gray-600" />
       })}
     </div>
   )
 }


 const getRankCardBackground = (rank: number) => {
   switch (rank) {
     case 1:
       return "from-[#fef3c7] via-[#faf5ff] to-[#e0f2fe]" // soft gold / lavender / blue
     case 2:
       return "from-[#e5e7eb] via-white to-[#ede9fe]" // silver / white / soft purple
     case 3:
       return "from-[#ffedd5] via-white to-[#fef3c7]" // bronze / white / soft gold
     default:
       return "from-[#f5ebff] via-white to-[#e0f2fe]" // lavender / white / soft blue
   }
 }


 const getRankDecoration = (rank: number) => {
   const baseClasses =
     "absolute -bottom-3 -right-1 sm:-bottom-4 sm:-right-2 w-20 h-20 sm:w-24 sm:h-24 opacity-[0.08] sm:opacity-10 text-purple-500 dark:text-purple-300 pointer-events-none"


   if (rank === 1) {
     return (
       <Trophy className={baseClasses + " rotate-6"} />
     )
   }
   if (rank === 2) {
     return (
       <Medal className={baseClasses + " text-gray-500 dark:text-gray-300 -rotate-6"} />
     )
   }
   if (rank === 3) {
     return (
       <Award className={baseClasses + " text-amber-500 dark:text-amber-300 rotate-3"} />
     )
   }


   // Ranks 4–10: subtle star background
   return (
     <Star className={baseClasses + " text-purple-400 dark:text-purple-300 rotate-12"} />
   )
 }


 const handleCourseClick = (courseId: string) => {
   router.push(`/course/${courseId}`)
 }


 if (isLoading) {
   return (
     <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-2 border-purple-200 dark:border-purple-800">
       <CardHeader>
         <CardTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
           <Trophy className="w-6 h-6 text-purple-600" />
           Top 10 Most Reviewed Courses
         </CardTitle>
       </CardHeader>
       <CardContent>
         <div className="flex justify-center items-center min-h-[300px]">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
         </div>
       </CardContent>
     </Card>
   )
 }


 if (error) {
   return (
     <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-2 border-purple-200 dark:border-purple-800">
       <CardHeader>
         <CardTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
           <Trophy className="w-6 h-6 text-purple-600" />
           Top 10 Most Reviewed Courses
         </CardTitle>
       </CardHeader>
       <CardContent>
         <div className="text-center text-red-500 p-4">
           {error}
         </div>
       </CardContent>
     </Card>
   )
 }


 if (courses.length === 0) {
   return (
     <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-2 border-purple-200 dark:border-purple-800">
       <CardHeader>
         <CardTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
           <Trophy className="w-6 h-6 text-purple-600" />
           Top 10 Most Reviewed Courses
         </CardTitle>
       </CardHeader>
       <CardContent>
         <div className="text-center text-gray-500 p-4">
           No courses found
         </div>
       </CardContent>
     </Card>
   )
 }


 return (
   <Card className="bg-gradient-to-br from-[#f3e8ff] via-white to-[#fdf2ff] dark:from-gray-900/80 dark:via-gray-900 dark:to-gray-950 backdrop-blur-sm shadow-lg hover:shadow-2xl border border-purple-100/70 dark:border-purple-900/50 hover:-translate-y-0.5 transition-all duration-300">
     <CardHeader>
       <CardTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
         <Trophy className="w-6 h-6 text-purple-600" />
         Top 10 Most Reviewed Courses
       </CardTitle>
     </CardHeader>
     <CardContent className="px-2 sm:px-4 pb-6">
       <Carousel
         opts={{
           align: "start",
           loop: false,
           dragFree: true,
           containScroll: "trimSnaps",
         }}
         className="w-full relative"
       >
         <CarouselContent className="-ml-2 md:-ml-4">
           {courses.map((course) => (
             <CarouselItem
               key={course.courseId}
               className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
             >
               <div
                 onClick={() => handleCourseClick(course.courseId)}
                 className={
                   "group relative h-full p-5 pt-10 rounded-2xl border border-purple-100/70 dark:border-purple-900/40 " +
                   "bg-gradient-to-br " +
                   getRankCardBackground(course.rank) +
                   " dark:from-gray-900/85 dark:via-gray-900 dark:to-gray-950 " +
                   "hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-xl shadow-md " +
                   "transition-all duration-300 cursor-pointer flex flex-col overflow-hidden"
                 }
               >
                 {/* Rank Badge - Top Left (adjusted so full circle is visible) */}
                 <div className="absolute -top-0 left-5 z-20 pointer-events-none">
                   <div
                     className={`w-16 h-16 rounded-full flex items-center justify-center ${getRankBadgeColor(
                       course.rank
                     )} shadow-xl ring-4 ring-white dark:ring-gray-900`}
                   >
                     {getRankIcon(course.rank)}
                   </div>
                 </div>


                 {/* Course Info */}
                 <div className="flex-1 pt-8 pl-3 sm:pl-4">
                   <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2 line-clamp-2 min-h-[3.2rem]">
                     {course.courseName}
                   </h3>
                   <div className="flex items-center gap-2 mb-3">
                     <p className="text-base font-semibold text-purple-800 dark:text-purple-600">
                       {course.courseId}
                     </p>
                     {renderStars(course.averageRating)}
                   </div>


                   {/* Stats Section */}
                   <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                     {/* Rating */}
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-1.5">
                         <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                         <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                           Rating
                         </span>
                       </div>
                       <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                         {course.averageRating.toFixed(1)}
                       </span>
                     </div>


                     {/* Review Count */}
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-1.5">
                         <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                         <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                           Reviews
                         </span>
                       </div>
                       <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                         {course.totalReviews}
                       </span>
                     </div>
                   </div>
                 </div>


                 {/* Decorative rank background icon */}
                 {getRankDecoration(course.rank)}


                 {/* Hover effect gradient overlay */}
                 <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-300 pointer-events-none" />
               </div>
             </CarouselItem>
           ))}
         </CarouselContent>
         <CarouselPrevious className="hidden md:flex -left-12 h-10 w-10 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30" />
         <CarouselNext className="hidden md:flex -right-12 h-10 w-10 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30" />
       </Carousel>
      
       {/* Scroll hint for mobile */}
       <div className="mt-4 text-center">
         <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
           <span className="hidden sm:inline">Drag or scroll horizontally to view more</span>
           <span className="sm:hidden">Swipe to view more</span>
           <ChevronRight className="w-4 h-4 animate-pulse" />
         </p>
       </div>
     </CardContent>
   </Card>
 )
}





