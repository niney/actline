import { render } from "react-dom";
import "./index.css";
import PcbCommonParam from "./pojo/pcb-common-param";
import BomOrderDetail from "./components/BomOrderDetail";

declare const window: any;
declare const $: any;

export interface BomOrderDetailParam extends PcbCommonParam {
	samplepcbUrl: string;
	itId: string;
}

let param: BomOrderDetailParam = {
	el: "root",
	mlServerApiUrl: "http://localhost:8099/api",
	xpServerApiUrl: "http://localhost:8080/api",
	// xpServerApiUrl: "https://search.samplepcb.kr/api",
	fileServerApiUrl: "https://file.samplepcb.kr/api",
	samplepcbUrl: "https://www.samplepcb.co.kr",
	itId: "1677306227793"
};
$.extend(true, param, window.bomOrderDetailAppParam);

const rootEl = document.getElementById(param.el);

render(<BomOrderDetail params={param} />, rootEl);
