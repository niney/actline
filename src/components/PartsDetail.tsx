import * as React from "react";
import {hot} from "react-hot-loader";
import {PartDetailParam} from "../parts-detail-app";
import "./../assets/scss/PartsDetail.scss";
import { useEffect } from "react";
import { PcbPartSpec } from "../pojo/pcb-part-spec";

declare const $: any;
declare const GerberCart: any;
declare const bomAnalysisCommon: any;

type State = {
    items: any;
    purchaseStock: string;
    price: string;
    vatPrice: string;
    sellPrice: string;
    sendPrice: string;
    specByGroup: { [key: string]: Array<PcbPartSpec> };
}

class PartsDetail extends React.Component<Record<any, PartDetailParam>, State> {

    constructor(props) {
        super(props);
        this.state = {
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
            const response = await bomAnalysisCommon.searchSamplepcbPartsById(1, this.props.params.partsId, this.props.params.xpServerApiUrl)
            if(!response.result || response.totalCount === 0) {
                return;
            }
            const data = bomAnalysisCommon.convertParts(response.data, this.props.params.fileServerApiUrl);
            const results = data.search.results;
            const part = results[0].part;
            this.setState({
                items: {
                    parts: [part]
                }
            })
        } else {
            const response = $.ajax({
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
                                    <img src={item?.best_image?.url} alt=""/>
                                </div>
                            )}
                            {!item.best_image && (
                                <div className="border mb-2 h-60" />
                            )}
                            <div className="text-xs">위 상품 이미지는 참고용이며, 실제 제품과 다를 수 있습니다.</div>
                            <button className="sp-pd-btn-outline w-full mt-2" onClick={() => this.openDatasheet(item)}>데이터시트</button>
                            <p className="text-xs mt-2">정확한 사양은 위의 데이터시트에서 확인하세요</p>
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
                                <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        PACKAGING
                                    </dt>
                                    <dd className=" text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {item?.sellers?.offers?.packaging}
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
                                    <dt className="text-sm font-medium text-gray-500 leading-loose">
                                        수량
                                    </dt>
                                    <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        <input type="number" className="rounded-l-lg border outline-none leading-loose text-right" value={this.state.purchaseStock} onChange={(event) => this.changePurchaseStock(event, item)}/>
                                    </dd>
                                </div>
                                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        상품금액
                                    </dt>
                                    <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {this.state.price}원
                                    </dd>
                                </div>
                                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        부가세
                                    </dt>
                                    <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {this.state.vatPrice}원
                                    </dd>
                                </div>
                                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        배송비
                                    </dt>
                                    <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {this.state.sendPrice}원
                                    </dd>
                                </div>
                                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        총 결제금액
                                    </dt>
                                    <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {this.state.sellPrice}원 (부가세, 항공배송료등 포함)
                                    </dd>
                                </div>
                                {/*<div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">
                                        Attachments
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                                            <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                                <div className="w-0 flex-1 flex items-center">
                                                    <svg className="flex-shrink-0 h-5 w-5 text-gray-400"
                                                         xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                                                         fill="currentColor" aria-hidden="true">
                                                        <path data-fill-rule="evenodd"
                                                              d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                                                              data-clip-rule="evenodd"/>
                                                    </svg>
                                                    <span className="ml-2 flex-1 w-0 truncate">
              resume_back_end_developer.pdf
            </span>
                                                </div>
                                                <div className="ml-4 flex-shrink-0">
                                                    <a href="#"
                                                       className="font-medium text-indigo-600 hover:text-indigo-500">
                                                        Download
                                                    </a>
                                                </div>
                                            </li>
                                            <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                                <div className="w-0 flex-1 flex items-center">
                                                    <svg className="flex-shrink-0 h-5 w-5 text-gray-400"
                                                         xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                                                         fill="currentColor" aria-hidden="true">
                                                        <path data-fill-rule="evenodd"
                                                              d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                                                              data-clip-rule="evenodd"/>
                                                    </svg>
                                                    <span className="ml-2 flex-1 w-0 truncate">
              coverletter_back_end_developer.pdf
            </span>
                                                </div>
                                                <div className="ml-4 flex-shrink-0">
                                                    <a href="#"
                                                       className="font-medium text-indigo-600 hover:text-indigo-500">
                                                        Download
                                                    </a>
                                                </div>
                                            </li>
                                        </ul>
                                    </dd>
                                </div>*/}
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
                            <div>
                                <button className="sp-pd-btn-primary mt-2 w-full" onClick={() => this.goPurchase(item)}>구매하기</button>
                                <button className="sp-pd-btn-info mt-2 w-full" onClick={() => this.goEstimate(item)}>견적요청</button>
                            </div>
                        </div>

                    </div>

                    <div className="my-2 text-2xl">제품 내용</div>
                    <div dangerouslySetInnerHTML={{ __html: item.contents }} />

                    <div className="my-2 text-2xl">제품 스팩</div>
                    <div className="flex flex-col">
                        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                형식
                                            </th>
                                            <th scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                제품요약
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {/*{item?.specs && item?.specs.map(specs => (
                                            <tr key={specs.attribute.name}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {specs.attribute.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {specs.display_value}
                                                </td>
                                            </tr>)
                                        )}*/}
                                        {this.state.specByGroup && Object.entries(this.state.specByGroup).map(([key, specs]) =>
                                            <React.Fragment key={key}>
                                                <tr>
                                                    <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-black text-lg">
                                                        {key}
                                                    </td>
                                                </tr>
                                                {specs && specs.map(spec =>
                                                    <tr key={spec.attribute.name}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {spec.attribute.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {spec.display_value}
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

declare let module: Record<string, unknown>;

export default hot(module)(PartsDetail);
