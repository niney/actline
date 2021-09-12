import { render } from "react-dom";
import "whatwg-fetch";
import "./index.css";
import PartsKindForm from "./components/PartsKindForm";
import PcbCommonParam from "./pojo/pcb-common-param";

declare const window: any;
declare const $: any;

export interface PartKindFormParam extends PcbCommonParam {
	samplepcbUrl?: string;
	xpServerApiUrl?: string;
	mlServerApiUrl?: string;
	fileServerApiUrl?: string;
	savedCallback?: (resultResp) => void;
	managerName?: string;
	managerPhoneNumber?: string;
	managerEmail?: string;
}

const param: PartKindFormParam = {
	el: "root",
	samplepcbUrl: location.protocol + '//' + location.hostname + ':' + location.port,
	xpServerApiUrl: "http://localhost:8080/api",
	mlServerApiUrl: "http://localhost:8099/api",
	fileServerApiUrl: "https://file.samplepcb.kr/api",
	managerName: '관리자',
	managerPhoneNumber: '01012345678',
	managerEmail: 'info@samplepcb.co.kr'
};
$.extend(true, param, window.partsKindFormAppParam);

const rootEl = document.getElementById(param.el);

render(<PartsKindForm params={param} />, rootEl);
