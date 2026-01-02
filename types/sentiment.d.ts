declare module 'sentiment' {
  interface AnalysisResult {
    score: number
    comparative: number
    tokens: string[]
    words: string[]
    positive: string[]
    negative: string[]
  }

  class Sentiment {
    analyze(phrase: string): AnalysisResult
  }

  export = Sentiment
}
