import ActlineCommonParam from "./actline-common-param";

export default interface PcbCommonParam extends ActlineCommonParam {
    xpServerApiUrl?: string;
    mlServerApiUrl?: string;
    fileServerApiUrl?: string;
}
