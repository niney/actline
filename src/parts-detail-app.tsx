// webpack serve --config=configs/webpack/dev.js --env filename="parts-detail-app.tsx"
// set NODE_ENV=production
// webpack --config=configs/webpack/prod.js --env filename="parts-detail-app.tsx"

import { render } from "react-dom";
import PartsDetail from "./components/PartsDetail";
import 'whatwg-fetch';
import './index.css';
import {ActlineCommonParam} from "./actline-common-param";

declare const window: any;
declare const $: any;

export interface PartDetailParam extends ActlineCommonParam {
    mlServerUrl?: string;
    partsId: string;
}

let param: PartDetailParam = {
    el: 'root',
    mlServerUrl: 'http://localhost:8099',
    partsId: '1390305'
    // partsId: '107358700'
}
$.extend(true, param, window.partsDetailAppParam);

const rootEl = document.getElementById(param.el);

render(<PartsDetail params={param} />, rootEl);
