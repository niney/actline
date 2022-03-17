import { render } from "react-dom";
import PartsDetailOpenMarket from "./components/PartsDetailOpenMarket";
import "whatwg-fetch";
import "./index.css";
import PcbCommonParam from "./pojo/pcb-common-param";

declare const window: any;
declare const $: any;

export interface PartDetailOpenMarketParam extends PcbCommonParam {
	partsId: string;
	goPurchaseCallback?: (item, price, purchaseStock) => void;
	goEstimateCallback?: (item, price, purchaseStock) => void;
	serviceType: string;
}

let param: PartDetailOpenMarketParam = {
	el: "root",
	mlServerApiUrl: "http://localhost:8099/api",
	xpServerApiUrl: "http://localhost:8080/api",
	fileServerApiUrl: "https://file.samplepcb.kr/api",
	// partsId: "1390305",
	// partsId: '107358700'
	partsId: "Ch_3jn8Bv-GhPZSS8wKV",
	serviceType: 'openMarket'
};
$.extend(true, param, window.partsDetailOpenMarketAppParam);

const rootEl = document.getElementById(param.el);

render(<PartsDetailOpenMarket params={param} />, rootEl);
