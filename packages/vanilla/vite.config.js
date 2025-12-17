import { defineConfig } from "vite";

const base = process.env.NODE_ENV === "production" ? "/front_7th_chapter4-1/vanilla/" : "";

export default defineConfig({ 
  base,
  
  // [수정] SSR 환경에서 MSW 관련 모듈 로드 에러 방지
  ssr: {
    // 'msw'와 'msw/browser'를 외부(external) 모듈로 처리하여
    // Node.js 서버가 브라우저 전용 코드를 로드하려고 시도하는 것을 막습니다.
    external: [
      'msw', 
      'msw/browser'
    ],
  },
});