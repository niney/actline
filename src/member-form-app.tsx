import { render } from "react-dom";
import "whatwg-fetch";
import "./index.css";
import PcbCommonParam from "./pojo/pcb-common-param";
import MemberForm from "./components/MemberForm";
import { ApolloProvider } from "@apollo/client";
import client from "./pcb-apollo"

declare const window: any;
declare const $: any;

export interface MemberFormParam extends PcbCommonParam {
}

let param: MemberFormParam = {
	el: "root",
	mlServerApiUrl: "http://localhost:8099/api",
	xpServerApiUrl: "http://localhost:8080/api",
	fileServerApiUrl: "https://file.samplepcb.kr/api",
};
$.extend(true, param, window.memberFormAppParam);

render(
	<ApolloProvider client={client}>
		<MemberForm params={param} />
	</ApolloProvider>,
	document.getElementById(param.el)
);
