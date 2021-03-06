import * as React from "react";
import { ChangeEvent, Fragment } from "react";
import { hot } from "react-hot-loader";
import { PartFormParam } from "../parts-form-app";
import "./../assets/scss/App.scss";
import "../assets/scss/PartsForm.scss";
import "./../library/jquery.auto-complete.css";
import "./../library/jquery.auto-complete.js";
import { PcbPartSpec } from "../pojo/pcb-part-spec";

declare const $: any;
declare const document: any;
declare const window: any;
declare const oEditors: any;

type State = {
    item: PartsKindItem;
    purchaseStock: string;
    kindInfo: Array<any>;
    images: Array<PartsImage>;
}

type PartsKindItem = {
    id: string;
    serviceType?: string;
    subServiceType?: string;
    largeCategory?: string;
    mediumCategory?: string;
    smallCategory?: string;
    partName?: string;
    description?: string;
    manufacturerName?: string;
    partsPackaging?: string;
    packaging?: string;
    moq?: string;
    price?: string;
    price1?: string;
    price2?: string;
    price3?: string;
    price4?: string;
    price5?: string;
    inventoryLevel?: string;
    memo?: string;
    offerName?: string;
    images?: Array<PartsImage>;
    managerPhoneNumber: string;
    managerName: string;
    managerEmail: string;
    memberId: string;
    contents: string;
    specs: Array<PcbPartSpec>;
}

type PartsImage = {
    uploadFileName?: string;
    originFileName?: string;
    pathToken?: string;
    size?: number;
}

class PartsForm extends React.Component<Record<any, PartFormParam>, State> {

    kindResult: any = {};
    kindNameMap: any = {};
    partsWindowHandle: any;
    kindInfoAll: Array<any>;

    constructor(props) {
        super(props);
        const managerPhoneNumber = this.props.params.managerPhoneNumber;
        const managerName = this.props.params.managerName;
        const managerEmail = this.props.params.managerEmail;
        const memberId = this.props.params.memberId;

        this.state = {
            item: {
                id: undefined,
                largeCategory: '',
                mediumCategory: '',
                smallCategory: '',
                partName: '',
                description: '',
                manufacturerName: '',
                partsPackaging: '',
                packaging: '',
                moq: '',
                price: '',
                price1: '',
                price2: '',
                price3: '',
                price4: '',
                price5: '',
                inventoryLevel: '',
                memo: '',
                offerName: '',
                managerPhoneNumber,
                managerName,
                managerEmail,
                memberId,
                contents: '',
                specs: []
            },
            purchaseStock: '1',
            kindInfo: [],
            images: [{
                originFileName: ''
            }]
        }
        // ???????????? ????????? ???????????? ??????
        if (window.partsFormAppParam) {
            window.partsFormAppParam.saveExecute = (item) => {
                $.extend(true, this.state.item, item);
                return this.save(this.state.item);
            };
        }
    }

    async componentDidMount() {
        this.loadKind();
        this.onAutoCompleteEvents();
        this.settingEditorTemplate();
        if (this.props.params.partsId) {
            this.loadParts(this.props.params.partsId);
        }

    }

    /**
     * ???????????? ??????
     * @param name ???????????? ?????? ??????
     * @param url ??????
     */
    loadScript(name: string, url: string): Promise<boolean> {
        if ($('script[src*="'+ name + '"]').length !== 0) {
            return;
        }
        return new Promise(resolve => {
            const script = document.createElement("script");
            script.src = url;
            script.async = true;
            script.onload = () => {
                resolve(true);
            }
            document.body.appendChild(script);
        });
    }

    /**
     * ????????? ??????
     */
    async settingEditorTemplate() {
        const samplepcbUrl = this.props.params.samplepcbUrl;

const template = `
<!--<script src="${samplepcbUrl}/plugin/editor/smarteditor2/js/service/HuskyEZCreator.js"></script>-->
<script>var g5_editor_url = "${samplepcbUrl}/plugin/editor/smarteditor2", oEditors = [], ed_nonce = "32FRqI4uQA|1631386254|20393f10e545ccb43a42bc7200314a0dc827da44";</script>
<!--<script src="${samplepcbUrl}/plugin/editor/smarteditor2/config.js"></script>-->
<script>
        $(function(){
            $(".btn_cke_sc").click(function(){
                if ($(this).next("div.cke_sc_def").length) {
                    $(this).next("div.cke_sc_def").remove();
                    $(this).text("????????? ??????");
                } else {
                    $(this).after("<div class='cke_sc_def' />").next("div.cke_sc_def").load("${samplepcbUrl}/plugin/editor/smarteditor2/shortcut.html");
                    $(this).text("????????? ?????? ??????");
                }
            });
            $(document).on("click", ".btn_cke_sc_close", function(){
                $(this).parent("div.cke_sc_def").remove();
            });
        });
</script>
<textarea id="contents" name="contents" class="smarteditor2" maxlength="65536" style="width:100%;height:300px"></textarea>`;

        $('#editor').html(template);

        await this.loadScript('HuskyEZCreator.js', `${samplepcbUrl}/plugin/editor/smarteditor2/js/service/HuskyEZCreator.js`);
        await this.loadScript('smarteditor2/config.js', `${samplepcbUrl}/plugin/editor/smarteditor2/config.js`);
    }

    /**
     * ????????? ?????? ?????????
     * @param e
     */
    onChangeText(e: React.ChangeEvent<HTMLInputElement>) {
        const items = {...this.state.item}
        items[e.target.name] = e.target.value;
        this.setState({
            item : items
        });
    }

    /**
     * ??????, ?????? ??????
     */
    async loadKind() {
        const response = await $.get(this.props.params.xpServerApiUrl + '/pcbKind/_search?size=1000000000');
        const kindInfo = this.state.kindInfo;
        this.kindResult = response.data;
        for (const kind of this.kindResult) {
            if (!kindInfo[kind.target]) {
                kindInfo[kind.target] = [];
            }
            kindInfo[kind.target].push(kind);
            this.kindNameMap[kind.itemName] = kind;
        }
        this.kindInfoAll = Object.assign({}, kindInfo);
        this.setState({
            kindInfo: kindInfo
        });
        let item = this.state.item;
        if (kindInfo && kindInfo.length !== 0) {
            if (!item.largeCategory && kindInfo[1].length !== 0) {
                this.setKindInfoForCategory(kindInfo[1][0].itemName, 1);
            }
        }
    }

    /**
     * ???????????? ?????? ?????????
     * @param e
     * @param target
     */
    onChangeCategory(e: React.ChangeEvent<HTMLSelectElement>, target: number) {
        const items = { ...this.state.item }
        if(target !== undefined) {
            this.setKindInfoForCategory(e.target.value, target);
        }
    }

    /**
     * ???????????? ??????
     * @param itemName ???????????????
     * @param target ??????
     */
    setKindInfoForCategory(itemName: string, target: number) {
        // ?????? ???????????? ??????
        this.setCategory(itemName, target);
        // ?????? ???????????? ??????
        if(target === 1) {
            const childKindInfo = this.setChildCategory(itemName, target + 1); // ?????????
            if(childKindInfo) {
                this.setChildCategory(childKindInfo[0].itemName, target + 2); // ?????????
            }
        }
        if(target === 2) {
            this.setChildCategory(itemName, target + 1); // ?????????
        }
    }

    /**
     * ?????? ???????????? ??????
     * @param pItemName ?????? ???????????????
     * @param target ?????? ??????
     */
    private setChildCategory(pItemName: string, target: number): Array<any> {
        const kindInfo = this.state.kindInfo;
        const item = this.kindNameMap[pItemName];
        const pId = item.id;
        kindInfo[target] = $.grep(this.kindResult, (d) => {
            return d.target === target && d.pId === pId;
        });
        this.setState({
            kindInfo: kindInfo
        });
        if(kindInfo[target] && kindInfo[target].length !== 0) {
            this.setCategory(kindInfo[target][0].itemName, target);
        } else {
            this.setCategory('', target);
        }
        return kindInfo[target];
    }

    /**
     * ???????????? ??????
     * @param itemName ???????????????
     * @param target ??????
     */
    private setCategory(itemName, target: number) {
        const item = this.state.item;
        if (target === 1) {
            item.largeCategory = itemName;
        }
        if (target === 2) {
            item.mediumCategory = itemName;
        }
        if (target === 3) {
            item.smallCategory = itemName;
        }
        this.setState({
            item: item
        })
    }

    /**
     * ?????? ??????
     * @param item
     */
    requestSave(item: PartsKindItem): Promise<any> {
        return $.ajax({
            method: 'POST',
            url: this.props.params.xpServerApiUrl + '/pcbParts/_indexing',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(item)
        });
    }

    /**
     * ????????????
     * @param item
     * @param e
     */
    async save(item: PartsKindItem, e?: React.MouseEvent<HTMLButtonElement>) {
        // editor ?????? ????????????
        let contents_editor_data = oEditors.getById["contents"].getIR();
        oEditors.getById["contents"].exec("UPDATE_CONTENTS_FIELD", []);
        if ($.inArray(document.getElementById("contents").value.toLowerCase().replace(/^\s*|\s*$/g, ""), ["&nbsp;", "<p>&nbsp;</p>", "<p><br></p>", "<div><br></div>", "<p></p>", "<br>", ""]) != -1) {
            document.getElementById("contents").value = "";
        }
        if (contents_editor_data) {
            contents_editor_data = contents_editor_data.replace(/<p><br><\/p>$/, "");
            item.contents = contents_editor_data;
        }
        // ???????????? ?????????
        item.offerName = this.props.params.companyName;

        const response = await this.requestSave(item);
        if (response.result === false) {
            alert(response.message);
            return;
        }
        const uploadReps = await this.requestUploadFile(response.data.id);
        if(uploadReps) {
            item.id = response.data.id;
            await this.requestSave(item);
        }
        const savedCallback = this.props.params.savedCallback;
        if(!savedCallback) {
            return response;
        }
        savedCallback(response);
        return response;
    }

    /**
     * ????????? ?????? ??????
     * @param w
     * @param h
     */
    browserPopupCenterFeatures(w, h) {
        const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
        const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
        return "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" + w + ", height=" + h + ", top=" + y + ", left=" + x;
    }

    /**
     * ????????????
     * @param pathToken
     */
    downloadLink(pathToken: string): string {
        return this.props.params.fileServerApiUrl + '/host/' + pathToken;
    }

    /**
     * ???????????? ?????????
     */
    onAutoCompleteEvents(): void {
        this.onAutoCompleteCategoryEvent("partName");
        this.onAutoCompleteEvent("manufacturerName", 4);
        this.onAutoCompleteEvent("partsPackaging", 7);
        this.onAutoCompleteEvent("packaging", 5);
    }

    /**
     * ????????? ???????????? ?????????
     * @param name
     * @private
     */
    private onAutoCompleteCategoryEvent(name) {
        const that = this;
        $("[name=" + name + "]").autoComplete({
            minChars: 1,
            delay: 2000,
            // cache: false,
            source: function(term, response) {
                $.getJSON(that.props.params.mlServerApiUrl + "/searchParts", {
                    q: term
                }, (res) => {
                    if(res.search && res.search.results && res.search.results.length !== 0) {
                        const list = $.map(res.search.results, (result, i) => {
                            if (result.part) {
                                return result.part.mpn;
                            }
                        });
                        response(list);
                    }
                });
            },
            onSelect: (event, term, item) => {
                const items = { ...this.state.item }
                items[name] = term
                this.setState({
                    item: items
                });
                const partNumber = term;
                const qty = 1;
                const mode = 'search';
                this.partsWindowHandle = window.open('https://www.samplepcb.co.kr/shop/bom_analysis_parts.php?partNumber=' + partNumber + '&qty=' + qty + '&mode=' + mode, 'partForm', that.browserPopupCenterFeatures(1300, 876));
            }
        });

        window.addEventListener("message", (event) => {
            if(!event.data || !event.data.item) {
                return;
            }
            const receiveItem = JSON.parse(event.data.item);

            if(receiveItem.part) {
                // ????????????
                const categoryNameInfo = {};
                if (receiveItem.part.category) {
                    const name = receiveItem.part.category.name;
                    const findCategory = this.kindNameMap[name];
                    if (findCategory) {

                        let findCategoryName = findCategory.itemName
                        for (let i = 3; i >= 1; i--) {
                            if(!findCategoryName) {
                                continue;
                            }
                            // ?????? ????????????
                            const kindInfo = this.kindInfoAll;
                            const kind = kindInfo[i];
                            const findKind = ((name) => {
                                return $.grep(kind, (d) => {
                                    return d.itemName === name;
                                });
                            })(findCategoryName);
                            if(!findKind || findKind.length === 0) {
                                continue;
                            }
                            categoryNameInfo[i] = { selectedItemName: findCategoryName }; // ????????? ???????????? ??????
                            if(i === 1) {
                                continue;
                            }
                            // ?????? ???????????? ??????
                            const pKind = kindInfo[i - 1];
                            const pKindKind = ((pId) => {
                                return $.grep(pKind, (pD) => {
                                    return pD.id === pId;
                                });
                            })(findKind[0].pId);
                            findCategoryName = undefined
                            if(pKindKind && pKindKind.length !== 0) {
                                findCategoryName = pKindKind[0].itemName;
                                categoryNameInfo[i].pItemName = pKindKind[0].itemName; // ?????? ??????????????? ??????
                            }
                        }

                    }
                }
                // ????????? ??????????????? ?????? ??? ???????????? ??????
                for (let j = 1; j <= 3; j++) {
                    if (categoryNameInfo[j]) {
                        const category = categoryNameInfo[j];
                        if(category.selectedItemName) {
                            this.setKindInfoForCategory(category.selectedItemName, j);
                        }
                    }
                }

                const item = { ...that.state.item }
                // ????????????
                if(receiveItem.part.short_description) {
                    item.description = receiveItem.part.short_description;
                }
                // ?????????
                if(receiveItem.part.manufacturer) {
                    item.manufacturerName = receiveItem.part.manufacturer.name;
                }
                // ????????????
                if(receiveItem.part.sellers && receiveItem.part.sellers.offers && receiveItem.part.sellers.offers.packaging) {
                    item.packaging = receiveItem.part.sellers.offers.packaging;
                }
                // ??????????????????
                if(receiveItem.part.sellers && receiveItem.part.sellers.offers) {
                    item.moq = receiveItem.part.sellers.offers.moq;
                }
                if(receiveItem.part.specs) {
                    item.specs = receiveItem.part.specs;
                }

                that.setState({
                    item: item
                });
            }

            if(that.partsWindowHandle) {
                that.partsWindowHandle.close();
                that.partsWindowHandle = undefined;
            }

        }, false);
    }

    /**
     * ???????????? ?????????
     * @param name ???????????? ?????? attr
     * @param target  ????????????
     * @private
     */
    private onAutoCompleteEvent(name, target) {
        const that = this;
        $("[name=" + name + "]").autoComplete({
            minChars: 1,
            // cache: false,
            source: function(term, response) {
                $.getJSON(that.props.params.xpServerApiUrl + "/pcbKind/_search", { target: target, itemName: term }, (res) => {
                    const list = $.map(res.data, (val, i) => {
                        return val.itemName;
                    });
                    response(list, target);
                });
            },
            onSelect: (event, term) => {
                const item = { ...this.state.item }
                item[name] = term
                this.setState({
                    item: item
                });
            }
        });
    }

    /**
     * ?????? ?????? ?????????
     * @param event
     * @param image
     */
    onChangeFile(event: ChangeEvent<any>, image: PartsImage) {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }
        const images = this.state.images;
        const originFileName = image.originFileName;
        image.originFileName = event.target.files[0].name;

        if (!originFileName) {
            images.push({
                originFileName: ''
            });
        }
        this.setState({
            images: images
        });
    }

    /**
     * ????????? ??????
     * @param id
     */
    requestUploadFile(id: string): Promise<any> {
        const images = this.state.images;
        if (!images || images.length === 0) {
            return Promise.resolve(false);
        }

        const form = document.partsForm;
        const formData = new FormData(form);

        let cnt = 0;
        for (const image of images) {
            const $files = $(form).find("input[name='" + image.originFileName + "']");
            if ($files[0].files.length === 0) {
                continue;
            }
            formData.append(image.originFileName, $files[0]);
            cnt++;
        }

        if (cnt === 0) {
            return Promise.resolve(false);
        }

        formData.append('serviceType', 'pcbParts');

        const item = this.state.item;
        return $.ajax({
            url: this.props.params.fileServerApiUrl + '/uploadFileById/' + id,
            processData: false,
            contentType: false,
            data: formData,
            type: 'POST',
            success: (response) => {
                if (response.result) {
                    if (!item.images) {
                        item.images = response.data;
                    } else {
                        item.images = item.images.concat(response.data);
                    }
                }

                this.setState({
                    item: item
                })

                return response;
            }
        });
    }

    async loadParts(partsId: string) {
        let paramObj: any = {
            id: partsId
        };
        if (this.props.params.memberId) {
            paramObj.memberId = this.props.params.memberId;
        }
        if (this.props.params.serviceType) {
            paramObj.serviceType = this.props.params.serviceType;
        }
        const param = $.param(paramObj)
        const response = await $.get(this.props.params.xpServerApiUrl + '/pcbParts/_search?' + param);
        const item = response.data[0];
        if(!item) {
            return response;
        }
        if (item.contents) {
            // plugin/editor/smarteditor2/config.js ??????
            window.smarteditorOnAppLoad = (id) => {
                if (id === "contents") {
                    oEditors.getById[id].exec("PASTE_HTML", [item.contents]);
                }
            };
        }
        this.setState({
            item: item,
        });

    }

    needRegistration() {
        return (
            <div id="app" className="sp-pf-center">
                <div className="max-w-sm rounded-lg overflow-hidden shadow-lg bg-white m-4">
                    <div className="flex flex-col min-h-full">
                        <div className="px-6 py-4 border-b">
                            <div className="text-xl text-center">??????????????? ??????</div>
                        </div>
                        <div className="px-6 py-10 flex-grow">
                            <p className="text-gray-700 text-base">
                                ??????????????? ????????? ????????? ????????? ?????? ?????????????????? ???????????? ??????,
                                ???????????? ??????????????? ?????????.<br/>
                                ???????????????????
                            </p>
                        </div>
                        <div className="px-5 py-3 border-t bg-gray-100 flex justify-end">
                            <button className="btn-gradient-default text-gray-600 font-medium text-sm py-1 px-5 rounded mr-3">
                                ?????????
                            </button>
                            <button className="btn-gradient-danger text-white font-medium text-sm py-1 px-5 rounded"
                                    onClick={() => {location.href = "/bbs/member_confirm.php?url=register_form.php";}}>
                                ???
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    waitingApproval() {
        return (
            <div id="app" className="sp-pf-center">
                <div className="max-w-sm rounded-lg overflow-hidden shadow-lg bg-white m-4">
                    <div className="flex flex-col min-h-full">
                        <div className="px-6 py-4 border-b">
                            <div className="text-xl text-center">??????????????? ????????????</div>
                        </div>
                        <div className="px-6 py-10 flex-grow">
                            <p className="text-gray-700 text-base">
                                ??????????????? ?????? ?????? ????????????<br />
                                ???????????? ????????? ?????????????????? ?????????????????????.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    public render() {
        if (this.props.params.partnerAuth === 0 && this.props.params.memberType !== '??????') {
            return this.waitingApproval();
        }
        if (this.props.params.partnerAuth === 0 || this.props.params.memberType === '??????') {
            return this.needRegistration();
        }
        const item = this.state.item;
        const images = this.state.images;
        const kindInfo = this.state.kindInfo;
        const partsId = this.props.params.partsId;
        const isHideRegBtn = this.props.params.isHideRegBtn;
        const serviceType = this.props.params.serviceType ? this.props.params.serviceType : '';
        let isIfNone = true;
        let isNoneStyle = {};
        if (serviceType && serviceType === 'openMarket') {
            // ??????????????? ?????? ???????????? ?????????
            isIfNone = false;
            isNoneStyle = {
                display: 'none'
            }

        }
        return (
            <div id="app">
                <form name="partsForm" className="w-full" onSubmit={(e) => {e.preventDefault(); return false;}}>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3"/>
                        <div className="md:w-2/3 border-t"/>
                    </div>
                    {isIfNone && <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pf-label"
                                   htmlFor="largeCategory">
                                ?????????
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <select className="sp-pf-select" onChange={(event) => this.onChangeCategory(event, 1)} value={item.largeCategory}>
                                {kindInfo[1]?.map((kind, index) => (
                                    <option key={kind.id} value={kind.itemName}>{kind.displayName || kind.itemName}</option>
                                ))}
                            </select>
                        </div>
                    </div>}
                    {isIfNone && <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pf-label"
                                   htmlFor="mediumCategory">
                                ?????????
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <select className="sp-pf-select" onChange={(event) => this.onChangeCategory(event, 2)} value={item.mediumCategory}>
                                {kindInfo[2]?.map((kind, index) => (
                                    <option key={kind.id} value={kind.itemName}>{kind.displayName || kind.itemName}</option>
                                ))}
                            </select>
                        </div>
                    </div>}
                    {isIfNone && <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pf-label"
                                   htmlFor="smallCategory">
                                ?????????
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <select className="sp-pf-select" onChange={(event) => this.onChangeCategory(event, 3)} value={item.smallCategory}>
                                {kindInfo[3]?.map((kind, index) => (
                                    <option key={kind.id} value={kind.itemName}>{kind.displayName || kind.itemName}</option>
                                ))}
                            </select>
                        </div>
                    </div>}
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pf-label"
                                   htmlFor="partName">
                                ?????????
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pf-input" type="text" value={item.partName}
                                   name="partName"
                                   onChange={(event) => this.onChangeText(event)}/>
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pf-label"
                                   htmlFor="description">
                                ????????????
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pf-input" type="text" value={item.description}
                                   name="description"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pf-label">????????????</label>
                        </div>
                        <div className="md:w-2/3">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center">?????????</div>
                                <div className="text-center">???????????????</div>
                                <div className="text-center">????????????</div>
                                <div>
                                    <input className="sp-pf-input" type="text" value={item.manufacturerName}
                                           name="manufacturerName"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                                <div>
                                    <input className="sp-pf-input" type="text" value={item.partsPackaging}
                                            name="partsPackaging"
                                            onChange={(event) => this.onChangeText(event)} />
                                </div>
                                <div>
                                    <input className="sp-pf-input" type="text" value={item.packaging}
                                           name="packaging"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pf-label">
                                ??????
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <div className="grid grid-cols-5 gap-5">
                                <div className="text-center">1~9???</div>
                                <div className="text-center">10-99???</div>
                                <div className="text-center">100~499???</div>
                                <div className="text-center">500~999???</div>
                                <div className="text-center">1000??? ??????</div>
                                <div>
                                    <input className="sp-pf-input" type="text" value={item.price1}
                                           name="price1"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                                <div>
                                    <input className="sp-pf-input" type="text" value={item.price2}
                                           name="price2"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                                <div>
                                    <input className="sp-pf-input" type="text" value={item.price3}
                                           name="price3"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                                <div>
                                    <input className="sp-pf-input" type="text" value={item.price4}
                                           name="price4"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                                <div>
                                    <input className="sp-pf-input" type="text" value={item.price5}
                                           name="price5"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pf-label">??????</label>
                        </div>
                        <div className="md:w-2/3">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-center">??????????????????</div>
                                <div className="text-center">??????</div>
                                <div>
                                    <input className="sp-pf-input" type="text" value={item.moq}
                                           name="moq"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                                <div>
                                    <input className="sp-pf-input" type="text" value={item.inventoryLevel}
                                           name="inventoryLevel"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pf-label"
                                   htmlFor="images">
                                ????????????
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            {item.images && item.images.length !== 0 && item.images.map((image, index) => (
                                <div className="my-2"><a href={this.downloadLink(image.pathToken)} target="_blank">{image.originFileName}</a></div>
                            ))}
                            {images && images.length !== 0 && images.map((image, index) => (
                                <div key={index}>
                                    <input type="file"
                                            name={image.originFileName}
                                            onChange={(event) => this.onChangeFile(event, image)} />
                                </div>
                            ))}
                        </div>
                    </div>
                    {this.props.params.serviceType && this.props.params.serviceType === "openMarket" ?
                        <Fragment>
                            <div className="md:flex md:items-center mb-6">
                                <div className="md:w-1/3">
                                    <label className="sp-pf-label"
                                           htmlFor="managerPhoneNumber">
                                        ?????????
                                    </label>
                                </div>
                                <div className="md:w-2/3">
                                    <input className="sp-pf-input" type="text" value={item.managerPhoneNumber}
                                           name="managerPhoneNumber"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                            </div>
                            <div className="md:flex md:items-center mb-6">
                                <div className="md:w-1/3">
                                    <label className="sp-pf-label"
                                           htmlFor="managerName">
                                        ??????
                                    </label>
                                </div>
                                <div className="md:w-2/3">
                                    <input className="sp-pf-input" type="text" value={item.managerName}
                                           name="managerName"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                            </div>
                            <div className="md:flex md:items-center mb-6">
                                <div className="md:w-1/3">
                                    <label className="sp-pf-label"
                                           htmlFor="managerEmail">
                                        ?????????
                                    </label>
                                </div>
                                <div className="md:w-2/3">
                                    <input className="sp-pf-input" type="text" value={item.managerEmail}
                                           name="managerEmail"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                            </div>
                        </Fragment>
                        :
                        <Fragment>
                            <div className="md:flex md:items-center mb-6">
                                <div className="md:w-1/3">
                                    <label className="sp-pf-label"
                                           htmlFor="managerPhoneNumber">
                                        ????????? ?????????
                                    </label>
                                </div>
                                <div className="md:w-2/3">
                                    <input className="sp-pf-input" type="text" value={item.managerPhoneNumber}
                                           name="managerPhoneNumber"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                            </div>
                            <div className="md:flex md:items-center mb-6">
                                <div className="md:w-1/3">
                                    <label className="sp-pf-label"
                                           htmlFor="managerName">
                                        ????????????
                                    </label>
                                </div>
                                <div className="md:w-2/3">
                                    <input className="sp-pf-input" type="text" value={item.managerName}
                                           name="managerName"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                            </div>
                            <div className="md:flex md:items-center mb-6">
                                <div className="md:w-1/3">
                                    <label className="sp-pf-label"
                                           htmlFor="managerEmail">
                                        ????????? ?????????
                                    </label>
                                </div>
                                <div className="md:w-2/3">
                                    <input className="sp-pf-input" type="text" value={item.managerEmail}
                                           name="managerEmail"
                                           onChange={(event) => this.onChangeText(event)} />
                                </div>
                            </div>
                        </Fragment>
                    }
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pf-label">
                                ????????????
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <span className="text-xs">
                                <span className="mr-2">?????????, ??????, ????????? ????????? ??????????????? ???????????????????????? ???????????????.</span>
                                <a className="underline underline-offset-auto text-sky-400/100"
                                   href="https://www.samplepcb.co.kr/bbs/member_confirm.php?url=register_form.php">??????????????????</a>
                            </span>
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6" style={isNoneStyle}>
                        <div className="md:w-1/3">
                            <label className="sp-pf-label"
                                   htmlFor="contents">
                                ?????? ??????
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <div id="editor" />
                        </div>
                    </div>
                    {item.specs && item.specs.length !== 0 && (
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pf-label"
                                   htmlFor="contents">
                                ?????? ??????
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <ul>
                            {item.specs && item.specs.map((spec) =>(
                                <li key={spec.attribute.name}>{spec.attribute.name} : {spec.display_value}</li>
                            ))}
                            </ul>
                        </div>
                    </div>
                    )}
                    {isHideRegBtn === false &&
                    <div className="md:flex md:items-center md:justify-end mb-6">
                        <button className="sp-btn-primary md:w-40 w-full"
                                onClick={(event) => this.save(item, event)}>{partsId ? "??????" : "??????"}</button>

                    </div>}
                </form>
            </div>
        );
    }
}

declare let module: Record<string, unknown>;

export default hot(module)(PartsForm);
