import { useEffect } from "react";
// [수정] useRouterParams 훅 추가 (hooks 폴더에서 export 되었다고 가정)
import { useCurrentPage, useRouterParams } from "./router";
import { useRouterContext } from "./router/hooks/useRouterContext";
import { useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";

const CartInitializer = () => {
  useLoadCartStore();
  return null;
};

/**
 * 전체 애플리케이션 렌더링
 */
export const App = () => {
  const PageComponent = useCurrentPage();
  const router = useRouterContext();

  // [추가] 파라미터(id 등)가 변경될 때마다 컴포넌트를 리렌더링하기 위해 훅 사용
  const params = useRouterParams();

  // [추가] 페이지 변경 시 타이틀(Metadata) 업데이트 로직
  useEffect(() => {
    if (!PageComponent) return;

    // 현재 렌더링된 페이지 컴포넌트에 getTitle 함수가 있는지 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getTitle = (PageComponent as any).getTitle;

    if (typeof getTitle === "function") {
      const updateTitle = async () => {
        try {
          // router.params는 getter이므로 현재 시점의 최신 파라미터를 가져옵니다.
          const currentParams = router.params || {};
          const query = router.query || {};

          // getTitle 함수 실행
          const title = await getTitle({ ...currentParams, ...query });

          // 문서 타이틀 업데이트
          if (title) {
            document.title = title;
          }
        } catch (error) {
          console.error("Failed to update title:", error);
        }
      };

      updateTitle();
    }
    // [수정] params를 의존성 배열에 추가하여 id가 바뀔 때마다 실행되도록 함
  }, [PageComponent, router, params]);

  return (
    <>
      <ToastProvider>
        <ModalProvider>{PageComponent ? <PageComponent /> : null}</ModalProvider>
      </ToastProvider>
      <CartInitializer />
    </>
  );
};
