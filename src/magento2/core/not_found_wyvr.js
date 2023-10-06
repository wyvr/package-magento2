export function _wyvr({ data }) {
    if (data?.avoid_not_found) {
        return data?._wyvr;
    }
    return {
        ...(data?._wyvr ?? {}),
        ...{
            template: [`shop/NotFound`, 'shop/Default'],
            persist: false,
        },
    };
}
