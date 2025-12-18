import { useRouterContext } from "../../../router/hooks/useRouterContext";
import { useProductStore } from "../hooks";

export default function RelatedProducts() {
  const { relatedProducts } = useProductStore();
  const router = useRouterContext();
  if (relatedProducts.length === 0) {
    return null;
  }
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">관련 상품</h2>
        <p className="text-sm text-gray-600">같은 카테고리의 다른 상품들</p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 responsive-grid">
          {relatedProducts.slice(0, 20).map((relatedProduct) => (
            <div
              key={relatedProduct.productId}
              className="bg-gray-50 rounded-lg p-3 related-product-card cursor-pointer"
              data-product-id={relatedProduct.productId}
              onClick={() => router.push(`/product/${relatedProduct.productId}/`)}
            >
              <div className="aspect-square bg-white rounded-md overflow-hidden mb-2">
                <img
                  src={relatedProduct.image}
                  alt={relatedProduct.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{relatedProduct.title}</h3>
              <p className="text-sm font-bold text-blue-600">{Number(relatedProduct.lprice).toLocaleString()}원</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
