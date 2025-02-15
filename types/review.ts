export interface CourseStats {
  averageRating: number
  totalReviews: number
  gradeDistribution: Record<string, number>
  ratingDistribution: Record<number, number>
}

export interface DetailedReview extends Review {
  timestamp: string
  readingAmount: number
  contentDifficulty: number
  teachingQuality: number
  grade?: string
  major: string
}

export interface Course {
  id: string
  name: string
  stats: CourseStats
  reviews: DetailedReview[]
}

export interface Review {
  createdAt: string | number | Date
  id: string
  courseId: string
  courseName: string
  userId: string
  userName: string
  rating: number
  review: string
  faculty?: string
  major?: string
  studyPlan?: string
  section?: string
  readingAmount?: number
  contentDifficulty?: number
  teachingQuality?: number
  programType?: string
  electiveType?: string
  // createdAt: Date
  timestamp?: string
  likes: number
  dislikes: number
  hasLiked?: boolean
  hasDisliked?: boolean
  isBookmarked?: boolean
  comments?: string[]
  isAnonymous?: boolean
  grade?: string
}

export interface LocaleContent {
  language: string
  review: any
  profile: ReactNode
  signOut: ReactNode
  welcome: string
  courseTitle: string
  search: string
  courseName: string
  faculty: string
  major: string
  allReviews: string
  searchPlaceholder: string
  writeReview: string
  ratingDistribution: string
  gradeDistribution: string
  reviews: string
  
  post: string
  ratingStar: string
  courseNo: string
  plan: string
  grade: string
  homeworkAmount: string
  contentInterest: string
  teachingQuality: string
  yourReview: string
  verifyContent: string
  faculties: Array<{ value: string; label: string }>
  qaForum: string
  askQuestion: string
  postQuestion: string
  askedBy: string
  whatIsYourQuestion: string
  answer: string
  writeQA: string
  comment: string
  addComment: string
  writing: string
  programTypes: string
  electiveTypes: string
  international: string
  special: string
  freeElective: string
  generalElective: string
  majorElective: string
  showIdentity: string
  hideIdentity: string
  normalProgram: string
  specialProgram: string
  internationalProgram: string
  bilingualProgram: string
  trilingualProgram: string
  bookmarks: string
  history: string
  seeReviews: string
  questionPlaceholder: string
  posting: string
  others: string
  pleaseSpecify: string
  othersSpecify: string
  majorSelection: {
    placeholder: string
  }
  likes: string
  dislikes: string
  comments: string
}

export interface MajorSelection {
    major: string;
    customMajor?: string;
}

