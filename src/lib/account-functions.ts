import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const email = z.string().trim().email().max(254);
const password = z.string().min(8).max(128);

export const registerUserFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().trim().min(2).max(160),
      gender: z.enum(["male", "female"]).nullable(),
      email,
      password,
      confirmPassword: password,
    }),
  )
  .handler(async ({ data }) => (await import("@/server/user-auth")).registerUser(data));

export const resendVerificationFn = createServerFn({ method: "POST" })
  .validator(z.object({ email }))
  .handler(async ({ data }) => (await import("@/server/user-auth")).resendVerification(data.email));

export const verifyEmailFn = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(20).max(200) }))
  .handler(async ({ data }) => (await import("@/server/user-auth")).verifyEmail(data.token));

export const verifyEmailCodeFn = createServerFn({ method: "POST" })
  .validator(z.object({ email, code: z.string().regex(/^\d{4}$/) }))
  .handler(async ({ data }) =>
    (await import("@/server/user-auth")).verifyEmailCode(data.email, data.code),
  );

export const getAuthEmailModeFn = createServerFn({ method: "GET" }).handler(async () =>
  (await import("@/server/user-auth")).getAuthEmailMode(),
);

export const loginUserFn = createServerFn({ method: "POST" })
  .validator(z.object({ email, password: z.string().min(1).max(128) }))
  .handler(async ({ data }) =>
    (await import("@/server/user-auth")).loginUser(data.email, data.password),
  );

export const logoutUserFn = createServerFn({ method: "POST" }).handler(async () =>
  (await import("@/server/user-auth")).logoutUser(),
);

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(async () =>
  (await import("@/server/user-auth")).getCurrentUser(),
);

export const requestPasswordResetFn = createServerFn({ method: "POST" })
  .validator(z.object({ email }))
  .handler(async ({ data }) =>
    (await import("@/server/user-auth")).requestPasswordReset(data.email),
  );

export const resetPasswordFn = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(20).max(200), password, confirmPassword: password }))
  .handler(async ({ data }) =>
    (await import("@/server/user-auth")).resetPassword(
      data.token,
      data.password,
      data.confirmPassword,
    ),
  );

export const updateProfileFn = createServerFn({ method: "POST" })
  .validator(z.object({ name: z.string().trim().min(2).max(160) }))
  .handler(async ({ data }) => {
    const { requireUser } = await import("@/server/user-auth");
    const { updateProfile } = await import("@/server/user-service");
    return updateProfile((await requireUser()).id, data.name);
  });

export const uploadAvatarFn = createServerFn({ method: "POST" })
  .validator(z.custom<FormData>((value) => value instanceof FormData, "Expected form data"))
  .handler(async ({ data }) => {
    const { requireUser } = await import("@/server/user-auth");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("Выберите изображение.");
    const { uploadAvatar } = await import("@/server/user-service");
    return uploadAvatar((await requireUser()).id, file);
  });

export const getWishlistFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUser } = await import("@/server/user-auth");
  const { getWishlist } = await import("@/server/user-service");
  return getWishlist((await requireUser()).id);
});

export const mergeWishlistFn = createServerFn({ method: "POST" })
  .validator(z.object({ ids: z.array(z.string().uuid()).max(200) }))
  .handler(async ({ data }) => {
    const { requireUser } = await import("@/server/user-auth");
    const { mergeWishlist } = await import("@/server/user-service");
    return mergeWishlist((await requireUser()).id, data.ids);
  });

export const setWishlistItemFn = createServerFn({ method: "POST" })
  .validator(z.object({ productId: z.string().uuid(), saved: z.boolean() }))
  .handler(async ({ data }) => {
    const { requireUser } = await import("@/server/user-auth");
    const { setWishlistItem } = await import("@/server/user-service");
    return setWishlistItem((await requireUser()).id, data.productId, data.saved);
  });

export const getAccountOrdersFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUser } = await import("@/server/user-auth");
  const { getAccountOrders } = await import("@/server/user-service");
  return getAccountOrders((await requireUser()).id);
});

export const getAdminUsersFn = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string().max(100), page: z.number().int().min(1).max(100000) }))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("@/server/auth");
    requireAdmin();
    const { getAdminUsers } = await import("@/server/user-service");
    return getAdminUsers(data.query, data.page);
  });
