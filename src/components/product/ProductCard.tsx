import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { getCollection, minPrice, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useWishlist } from "@/store/wishlist";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  className,
  priority = false,
}: {
  product: Product;
  className?: string;
  priority?: boolean;
}) {
  const wishlist = useWishlist();
  const collection = getCollection(product.collection);
  const liked = wishlist.hydrated && wishlist.has(product.id);

  return (
    <article className={cn("group relative", className)}>
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block focus-visible:outline-offset-4"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          <img
            src={product.images[0]}
            alt={`${product.name} — ${collection?.tagline ?? "изделие NOIR ATELIER"}`}
            loading={priority ? "eager" : "lazy"}
            width={1008}
            height={1200}
            className="h-full w-full object-cover hover-zoom-img"
          />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
            {product.isNew ? <CardTag label="Новинка" /> : null}
            {product.bestseller ? <CardTag label="Хит" /> : null}
            {product.collection === "limited" ? <CardTag label="Лимит" /> : null}
          </div>
        </div>

        <div className="pt-4">
          <p className="label-caps text-taupe">{collection?.name}</p>
          <h3 className="mt-2 font-display text-xl leading-snug text-foreground">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {product.shortDescription}
          </p>
          <p className="mt-3 text-sm text-ink">
            <span className="text-muted-foreground">от </span>
            {formatPrice(minPrice(product))}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => wishlist.toggle(product.id)}
        aria-label={liked ? "Убрать из избранного" : "Добавить в избранное"}
        aria-pressed={liked}
        className={cn(
          "absolute right-3 top-3 flex h-9 w-9 items-center justify-center border border-hairline bg-background/85 backdrop-blur-sm transition-colors duration-300",
          liked ? "text-ink" : "text-taupe hover:text-ink",
        )}
      >
        <Heart className="h-4 w-4" strokeWidth={1.25} fill={liked ? "currentColor" : "none"} />
      </button>
    </article>
  );
}

function CardTag({ label }: { label: string }) {
  return (
    <span className="label-caps bg-background/85 px-2 py-1 text-[10px] text-ink backdrop-blur-sm">
      {label}
    </span>
  );
}
