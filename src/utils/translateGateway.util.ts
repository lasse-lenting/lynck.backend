export function translateGateway(gateway: number) {
    switch (gateway) {
        case 0:
            return 'coinbasecommerce';
        case 1:
            return 'stripe';
        case 2:
            return 'paypal';
        case 3:
            return 'cashapp';
        case 4:
            return 'paypalff';
        case 5:
            return 'virtualpayments';
        case 6:
            return 'square';
        default:
            return 'unknown';
    }
}