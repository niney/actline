import { render } from "react-dom";
import "whatwg-fetch";
import "./index.css";
import PartsForm from "./components/PartsForm";
import PcbCommonParam from "./pojo/pcb-common-param";

declare const window: any;
declare const $: any;

export interface PartFormParam extends PcbCommonParam {
	samplepcbUrl?: string;
	savedCallback?: (resultResp) => void;
	managerName?: string;
	managerPhoneNumber?: string;
	managerEmail?: string;
	memberId: string;
	memberType: string;
	companyName: string;
	partnerAuth: number;
	partsId?: string;
	isHideRegBtn?: boolean;
	serviceType?: string;
}

const param: PartFormParam = {
	el: "root",
	samplepcbUrl: location.protocol + '//' + location.hostname + ':' + location.port,
	xpServerApiUrl: "http://localhost:8080/api",
	// xpServerApiUrl: "https://search.samplepcb.kr/api",
	mlServerApiUrl: "http://localhost:8099/api",
	fileServerApiUrl: "https://file.samplepcb.kr/api",
	managerName: '관리자',
	managerPhoneNumber: '01012345678',
	managerEmail: 'info@samplepcb.co.kr',
	// memberId: 'admin',
	memberId: 'tester2',
	memberType: '파트너',
	companyName: '파트너사',
	partnerAuth: 1,
	isHideRegBtn: false,
	// partsId: 'RB6Ff38Bv-GhPZSSyOE1'
};
$.extend(true, param, window.partsFormAppParam);

const rootEl = document.getElementById(param.el);

render(<PartsForm params={param} />, rootEl);
