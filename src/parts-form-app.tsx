import { render } from "react-dom";
import "whatwg-fetch";
import "./index.css";
import PartsForm from "./components/PartsForm";
import PcbCommonParam from "./pojo/pcb-common-param";

declare const window: any;
declare const $: any;

export interface PartFormParam extends PcbCommonParam {
	samplepcbUrl?: string;
	xpServerApiUrl?: string;
	mlServerApiUrl?: string;
	fileServerApiUrl?: string;
	savedCallback?: (resultResp) => void;
	managerName?: string;
	managerPhoneNumber?: string;
	managerEmail?: string;
	memberId: string;
	memberType: string;
	partnerAuth: number;
}

const param: PartFormParam = {
	el: "root",
	samplepcbUrl: location.protocol + '//' + location.hostname + ':' + location.port,
	xpServerApiUrl: "http://localhost:8080/api",
	mlServerApiUrl: "http://localhost:8099/api",
	fileServerApiUrl: "https://file.samplepcb.kr/api",
	managerName: '관리자',
	managerPhoneNumber: '01012345678',
	managerEmail: 'info@samplepcb.co.kr',
	memberId: 'admin',
	memberType: '파트너',
	partnerAuth: 1
};
$.extend(true, param, window.partsFormAppParam);

const rootEl = document.getElementById(param.el);

render(<PartsForm params={param} />, rootEl);
