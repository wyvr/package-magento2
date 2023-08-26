export function is_guest_token(email_or_cart_token) {
    return (
        typeof email_or_cart_token == 'string' &&
        (email_or_cart_token === 'guest' || email_or_cart_token.indexOf('@') == -1)
    );
}
