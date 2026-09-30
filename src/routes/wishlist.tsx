import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/product/ProductCard";
import { useCatalog } from "@/store/catalog";
import { useWishlist } from "@/store/wishlist";
export const Route = createFileRoute("/wishlist")({ component: WishlistPage });
function WishlistPage() {
  const { products } = useCatalog();
  const wishlist = useWishlist();
  const saved = products.filter((product) => wishlist.has(product.id));
  return (
    <div className="container-page py-10">
      <p className="label-caps text-taupe">Избранное</p>
      <h1 className="display-lg mt-4">Сохранённые изделия</h1>
      {saved.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {saved.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="mt-8">
          Пока пусто.{" "}
          <Link to="/catalog" className="underline">
            Перейти в каталог
          </Link>
        </p>
      )}
    </div>
  );
}
