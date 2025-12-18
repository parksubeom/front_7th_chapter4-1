import { useState } from "react";
import { PublicImage } from "../../../components";
import { useRouterContext } from "../../../router/hooks/useRouterContext";
import type { StringRecord } from "../../../types";
import { log } from "../../../utils";
import { useCartAddCommand } from "../../carts";
import type { Product } from "../types";
import RelatedProducts from "./RelatedProducts";

export function ProductDetail(product: Readonly<Product>) {
  log(`ProductDetail: ${product.productId}`);
  const addToCart = useCartAddCommand();
  const { productId, title, image, lprice, brand, category1, category2 } = product;
  const [cartQuantity, setCartQuantity] = useState(1);
  const router = useRouterContext();

  const description = "",
    rating = 0,
    reviewCount = 0,
    stock = 100;

  const price = Number(lprice);

  // 브레드크럼 생성
  const breadcrumbItems: Array<{ name: string; category: string; value: string }> = [];

  if (category1)
    breadcrumbItems.push({
      name: category1,
      category: "category1",
      value: category1,
    });

  if (category2)
    breadcrumbItems.push({
      name: category2,
      category: "category2",
      value: category2,
    });

  // 상품 상세 페이지에서 수량 증가/감소
  const incrementQuantity = () => setCartQuantity(Math.min(cartQuantity + 1, stock));
  const decrementQuantity = () => setCartQuantity(Math.max(cartQuantity - 1, 1));

  const goToHomeWithCategory = async (categories: StringRecord) => {
    const queryString = new URLSearchParams(categories).toString();
    router.push(`/?${queryString}`);
  };

  const goToHomeWithCurrentCategory = async () => {
    const query = {
      ...(product?.category1 && { category1: product?.category1 }),
      ...(product?.category2 && { category2: product?.category2 }),
    };
    const queryString = new URLSearchParams(query).toString();
    router.push(`/?${queryString}`);
  };

  return (
    <div>
      {/* 브레드크럼 */}
      {breadcrumbItems.length > 0 && (
        <nav className="mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/" data-link="/" className="hover:text-blue-600 transition-colors">
              홈
            </a>
            {breadcrumbItems
              .map((item, index) => [
                <PublicImage
                  key={`${item.category}-icon`}
                  src="/chevron-right-icon.svg"
                  alt="오른쪽 화살표"
                  className="w-4 h-4 text-gray-400"
                />,
                <button
                  key={`${item.category}-btn`}
                  className="breadcrumb-link"
                  {...{
                    [`data-${item.category}`]: item.value,
                  }}
                  onClick={() =>
                    goToHomeWithCategory(
                      index === 0
                        ? { category1: item.value }
                        : { category1: breadcrumbItems[index - 1].value, category2: item.value },
                    )
                  } // 카테고리 클릭 시 홈으로 이동
                >
                  {item.name}
                </button>,
              ])
              .flat()}
          </div>
        </nav>
      )}

      {/* 상품 상세 정보 */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        {/* 상품 이미지 */}
        <div className="p-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img src={image} alt={title} className="w-full h-full object-cover product-detail-image" />
          </div>

          {/* 상품 정보 */}
          <div>
            <p className="text-sm text-gray-600 mb-1">{brand}</p>
            <h1 className="text-xl font-bold text-gray-900 mb-3">{title}</h1>

            {/* 평점 및 리뷰 */}
            {rating > 0 && (
              <div className="flex items-center mb-3">
                <div className="flex items-center">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <PublicImage
                        key={i}
                        src="/star-icon.svg"
                        alt="별점"
                        className={`w-4 h-4 ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {rating}.0 ({reviewCount.toLocaleString()}개 리뷰)
                </span>
              </div>
            )}

            {/* 가격 */}
            <div className="mb-4">
              <span className="text-2xl font-bold text-blue-600">{price.toLocaleString()}원</span>
            </div>

            {/* 재고 */}
            <div className="text-sm text-gray-600 mb-4">재고 {stock.toLocaleString()}개</div>

            {/* 설명 */}
            {description && <div className="text-sm text-gray-700 leading-relaxed mb-6">{description}</div>}
          </div>
        </div>

        {/* 수량 선택 및 액션 */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-900">수량</span>
            <div className="flex items-center">
              <button
                id="quantity-decrease"
                className="w-8 h-8 flex items-center justify-center border border-gray-300
                             rounded-l-md bg-gray-50 hover:bg-gray-100"
                onClick={decrementQuantity}
              >
                <PublicImage src="/quantity-minus-icon.svg" alt="수량 감소" className="w-4 h-4" />
              </button>

              <input
                type="number"
                id="quantity-input"
                value={cartQuantity}
                onInput={(e) => setCartQuantity(Number(e.currentTarget.value))}
                min="1"
                max={stock}
                className="w-16 h-8 text-center text-sm border-t border-b border-gray-300
                            focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />

              <button
                id="quantity-increase"
                className="w-8 h-8 flex items-center justify-center border border-gray-300
                             rounded-r-md bg-gray-50 hover:bg-gray-100"
                onClick={incrementQuantity}
              >
                <PublicImage src="/quantity-plus-icon.svg" alt="수량 증가" className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 액션 버튼 */}
          <button
            id="add-to-cart-btn"
            data-product-id={productId}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md
                         hover:bg-blue-700 transition-colors font-medium"
            onClick={() => addToCart(product, cartQuantity)}
          >
            장바구니 담기
          </button>
        </div>
      </div>

      {/* 상품 목록으로 이동 */}
      <div className="mb-6">
        <button
          className="block w-full text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-md
                  hover:bg-gray-200 transition-colors go-to-product-list"
          onClick={goToHomeWithCurrentCategory}
        >
          상품 목록으로 돌아가기
        </button>
      </div>

      {/* 관련 상품 */}
      <RelatedProducts />
    </div>
  );
}
