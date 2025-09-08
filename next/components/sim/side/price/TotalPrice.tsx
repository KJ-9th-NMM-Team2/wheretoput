interface TotalPriceProps {
    totalPrice: number;
}
export function TotalPrice({totalPrice} : TotalPriceProps) {

    // 3자리마다 콤마 추가하는 함수 (여러 방법으로 대응)
    const formatPrice = (price: number): string => {
        // 방법 1: 정규식 사용 (가장 확실한 방법)
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // 방법 2: toLocaleString 백업
        // return price.toLocaleString() || price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    return <>
        {/* 개선된 가격 표시 */}
        {totalPrice > 0 && (
            <span className="text-sm text-gray-700">
                합계: ₩{formatPrice(totalPrice)}
            </span>
        )}
    </>
}