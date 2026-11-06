/** Maximum seller bio length used across profile surfaces. */
export const SELLER_BIO_MAX_LENGTH = 160;

/** Keeps bio text within the profile limit without splitting surrogate pairs. */
export const limitSellerBio = (bio: string): string => {
  const characters = Array.from(bio);
  if (characters.length <= SELLER_BIO_MAX_LENGTH) return bio;
  return `${characters.slice(0, SELLER_BIO_MAX_LENGTH - 1).join('')}…`;
};
