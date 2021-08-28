// webpack serve --config=configs/webpack/dev.js --env filename="parts-detail-app.tsx"
// set NODE_ENV=production
// webpack --config=configs/webpack/prod.js --env filename="parts-detail-app.tsx"

import { render } from "react-dom";
import PartsDetail from "./components/PartsDetail";
import "whatwg-fetch";
import "./index.css";
import PcbCommonParam from "./pojo/actline-common-param";

declare const window: any;
declare const $: any;

export interface PartDetailParam extends PcbCommonParam {
	partsId: string;
	goPurchaseCallback?: (item, price, purchaseStock) => void;
	goEstimateCallback?: (item, price, purchaseStock) => void;
}

let param: PartDetailParam = {
	el: "root",
	mlServerApiUrl: "http://localhost:8099/api",
	xpServerApiUrl: "http://localhost:8080/api",
	fileServerApiUrl: "https://file.samplepcb.kr/api",
	partsId: "1390305",
	// partsId: "dtZeznoB-1ek5PcvtYoG",
	// partsId: '107358700'
};
$.extend(true, param, window.partsDetailAppParam);

const rootEl = document.getElementById(param.el);

render(<PartsDetail params={param} />, rootEl);
