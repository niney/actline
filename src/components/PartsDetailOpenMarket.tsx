import * as React from "react";
import { hot } from "react-hot-loader";
import { PartDetailOpenMarketParam } from "../parts-detail-open-market-app";
import "./../assets/scss/PartsDetailOpenMarket.scss";
import { PcbPartSpec } from "../pojo/pcb-part-spec";

declare const $: any;
declare const GerberCart: any;
declare const bomAnalysisCommon: any;

type State = {
    responseData: any;
    items: any;
    purchaseStock: string;
    price: string;
    vatPrice: string;
    sellPrice: string;
    sendPrice: string;
    specByGroup: { [key: string]: Array<PcbPartSpec> };
}

class PartsDetailOpenMarket extends React.Component<Record<any, PartDetailOpenMarketParam>, State> {

    constructor(props) {
        super(props);
        this.state = {
            responseData: {},
            items: {},
            purchaseStock: '1',
            sellPrice: '0',
            vatPrice: '0',
            price: '0',
            sendPrice: '0',
            specByGroup: {}
        }
    }

    async componentDidMount() {
        // script 로드
        await this.loadScript();

        if(isNaN(Number(this.props.params.partsId))) {
            let param = undefined;
            if (this.props.params.serviceType) {
                param = {
                    serviceType: this.props.params.serviceType
                };
            }
            const response = await bomAnalysisCommon.searchSamplepcbPartsById(1, this.props.params.partsId, this.props.params.xpServerApiUrl, param);
            if(!response.result || response.totalCount === 0) {
                return;
            }
            const data = bomAnalysisCommon.convertParts(response.data, this.props.params.fileServerApiUrl);
            const results = data.search.results;
            const part = results[0].part;
            this.setState({
                responseData: response.data[0],
                items: {
                    parts: [part]
                }
            })
        } else {
            const response = await $.ajax({
                type: 'post',
                url: this.props.params.mlServerApiUrl + '/searchPartsByIds',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({
                    ids: [this.props.params.partsId]
                })
            });
            this.setState({
                items: response
            })
            const part = response.parts[0];
            if (part.sellers) {
                const sellers = part.sellers;
                if (sellers.offers && sellers.offers.prices) {
                    const prices = sellers.offers.prices;
                    sellers.offers.prices = bomAnalysisCommon.getSelectedPrices(prices); // 가격선택
                }
            }
            this.setStateCalcPriceCurrency(part, 1);
        }

        if(this.state.items.parts && this.state.items.parts[0].specs) {
            const specByGroup = this.state.specByGroup;
            for (const spec of this.state.items.parts[0].specs) {
                if(!specByGroup.hasOwnProperty(spec.attribute.group)) {
                    specByGroup[spec.attribute.group] = [];
                }
                specByGroup[spec.attribute.group].push(spec)
            }
            this.setState({
                specByGroup: specByGroup
            })
        }

    }

    loadScript(): Promise<boolean> {
        if($('script[src*="bom.analysis.common.js"]').length !== 0 ) {
            return;
        }
        return new Promise(resolve => {
            const script = document.createElement("script");
            script.src = "//samplepcb.co.kr/js/bom.analysis.common.js";
            script.async = true;
            script.onload = () => {
                resolve(true);
            }
            document.body.appendChild(script);
        });
    }

    /**
     * 숫자 콤마 넣기
     * @param value
     */
    currency(value) {
        const num = Number(value);
        return num.toFixed().replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,")
    }

    /**
     * 판매가 계산
     * @param part 상품
     * @param purchaseStock 수량
     */
    calcPrice(part, purchaseStock) {
        const prices = part.sellers.offers.prices;
        let selectedPrice = prices[0];
        for(let i = 1, len = prices.length; i < len; i++) {
            let price = prices[i];
            if(price.quantity <= purchaseStock) {
                selectedPrice = price;
            }
        }

        if(!selectedPrice || !selectedPrice.converted_price ) {
            return 0;
        }
        return purchaseStock * selectedPrice.converted_price.toFixed();
    }

    /**
     * 판매가를 계산하여 갱신
     * @param part 상품
     * @param purchaseStock 수량
     */
    setStateCalcPriceCurrency(part, purchaseStock) {
        const price = parseInt(this.calcPrice(part, purchaseStock).toFixed()); // 가격
        const sendPrice = price < 50000 ? 2500 : 0; // 5만원 이상은 배송비 무료
        const vatPrice = parseInt((price * 0.1).toFixed()); // 부가세
        const sellPrice = price + sendPrice + vatPrice; // 판매가격

        const currencyPrice = this.currency(price);
        const currencyVatPrice = this.currency(vatPrice);
        const currencySellPrice = this.currency(sellPrice);
        const currencySendPrice = this.currency(sendPrice);
        if(purchaseStock <= 0) {
            return;
        }
        this.setState({
            purchaseStock: purchaseStock,
            price: currencyPrice,
            vatPrice: currencyVatPrice,
            sellPrice: currencySellPrice,
            sendPrice: currencySendPrice
        });
        return currencyPrice;
    }

    /**
     * 수량 변경 이벤트
     * @param event
     * @param part 상품
     */
    changePurchaseStock(event, part) {
        const purchaseStock = event.target.value;
        this.setStateCalcPriceCurrency(part, purchaseStock);
    }

    /**
     * 데이터시트 열기
     * @param item
     */
    openDatasheet(item) {
        window.open(item.best_datasheet.url, '_blank');
    }

    /**
     * 구매하기 이벤트
     * @param items
     */
    goPurchase(items) {
        const goPurchaseCallback = this.props.params.goPurchaseCallback;
        if(!goPurchaseCallback) {
            return;
        }
        goPurchaseCallback(items, this.state.price, this.state.purchaseStock);
    }

    /**
     * 견적요청하기 이벤트
     * @param items
     */
    goEstimate(items) {
        const goEstimateCallback = this.props.params.goEstimateCallback;
        if(!goEstimateCallback) {
            return;
        }
        goEstimateCallback(items, this.state.price, this.state.purchaseStock);
    }

    public render() {
        const {responseData} = this.state;
        const {items} = this.state;
        let item;
        if(!items.parts) {
            return false;
        }
        item = items.parts[0];
        return (
            <div id="app" className="p-3">
                <div className="max-w-full mx-auto bg-white overflow-hidden">
                    <p className="my-5 text-sm">
                        {item?.category?.path && item?.category?.path.substr(1).replace(/\//gi, ' > ')}
                    </p>
                    <div className="md:flex">
                        <div className="md:flex-shrink-0 md:mr-3 mb-2 md:w-72">
                            {item.best_image && (
                                <div className="border mb-2">
                                    <a href={item?.best_image?.url} target="_blank">
                                        <img src={item?.best_image?.url} alt="" />
                                    </a>
                                </div>
                            )}
                            {!item.best_image && (
                                <div className="border mb-2 h-60" />
                            )}
                            {/*<div className="text-xs">위 상품 이미지는 참고용이며, 실제 제품과 다를 수 있습니다.</div>*/}
                            {item.best_datasheet && item.best_datasheet.url &&
                            <React.Fragment>
                                <button className="sp-pd-btn-outline w-full mt-2"
                                        onClick={() => this.openDatasheet(item)}>데이터시트
                                </button>
                                <p className="text-xs mt-2">정확한 사양은 위의 데이터시트에서 확인하세요</p>
                            </React.Fragment>}

                        </div>
                        <div className="border-gray-200 md:w-1/2">
                            <div className="mb-5">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    {item?.mpn}
                                </h3>
                                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                    {item?.short_description}
                                </p>
                            </div>
                            <dl>
                                <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        제조사
                                    </dt>
                                    <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {item?.manufacturer.name}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        MPN
                                    </dt>
                                    <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {item?.mpn}
                                    </dd>
                                </div>
                                <hr className="my-3"/>
                                <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        재고
                                    </dt>
                                    <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {item?.sellers?.offers?.inventory_level} EA
                                    </dd>
                                </div>
                                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        최소 구매수량(MOQ)
                                    </dt>
                                    <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {item?.sellers?.offers?.moq} EA
                                    </dd>
                                </div>
                                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        담당자
                                    </dt>
                                    <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {responseData.managerName}
                                    </dd>
                                </div>
                                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        연락처
                                    </dt>
                                    <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {responseData.managerPhoneNumber}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                        <div className="md:w-52 md:ml-3 mb-2">
                            <div className="border p-2 text-right">
                            {item?.sellers?.offers?.prices?.map((price, index)=>(
                                <dl key={index}>
                                    <dt className="float-left w-3/5 md:w-16 text-xs text-gray-500">
                                        {price.quantity}개
                                    </dt>
                                    <dd className="text-xs text-gray-900 leading-5">
                                        {price.converted_price && this.currency(price.converted_price)} 원
                                    </dd>
                                </dl>
                            ))}
                            </div>
                        </div>

                    </div>

                    {/*{item.contents && (
                    <>
                    <div className="my-2 text-2xl">제품 내용</div>
                    <div dangerouslySetInnerHTML={{ __html: item.contents }} />
                    </>
                    )}*/}
                </div>
            </div>
        );
    }
}

declare let module: Record<string, unknown>;

export default hot(module)(PartsDetailOpenMarket);
