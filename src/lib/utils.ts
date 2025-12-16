export const getURL = () => {
    let url =
        process.env.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
        process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
        'http://localhost:3000/';

    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`;
    // Make sure to include a trailing `/`.
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
    return url;
};

export const translateAuthError = (errorMessage: string): string => {
    switch (errorMessage) {
        case 'User already registered':
            return 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.';
        case 'Invalid login credentials':
            return 'E-posta veya şifre hatalı. Lütfen kontrol edin.';
        case 'Email not confirmed':
            return 'E-posta adresi doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.';
        case 'Password should be at least 6 characters':
            return 'Şifre en az 6 karakter olmalıdır.';
        case 'Signup requires a valid password':
            return 'Geçerli bir şifre girin.';
        default:
            return errorMessage; // Bilinmeyen hataları olduğu gibi göster
    }
};
