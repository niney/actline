import * as React from "react";
import { hot } from "react-hot-loader";
import { PartKindFormParam } from "../parts-kind-form-app";
import "./../assets/scss/App.scss";
import "./../assets/scss/PartsKindForm.scss";
import "./../library/jquery.auto-complete.css";
import "./../library/jquery.auto-complete.js";
import { ChangeEvent } from "react";
import { PcbPartSpec } from "../pojo/pcb-part-spec";

declare const $: any;
declare const document: any;
declare const oEditors: any;

type State = {
    item: PartsKindItem;
    purchaseStock: string;
    kindInfo: Array<any>;
    images: Array<PartsImage>;
}

type PartsKindItem = {
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
    contents: string;
    specs: Array<PcbPartSpec>;
}

type PartsImage = {
    uploadFileName?: string;
    originFileName?: string;
    pathToken?: string;
    size?: number;
}

class PartsKindForm extends React.Component<Record<any, PartKindFormParam>, State> {

    kindResult: any = {};
    kindNameMap: any = {};
    partsWindowHandle: any;
    kindInfoAll: Array<any>;

    constructor(props) {
        super(props);
        const managerPhoneNumber = this.props.params.managerPhoneNumber;
        const managerName = this.props.params.managerName;
        const managerEmail = this.props.params.managerEmail;

        this.state = {
            item: {
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
                contents: '',
                specs: []
            },
            purchaseStock: '1',
            kindInfo: [],
            images: [{
                originFileName: ''
            }]
        }
    }

    async componentDidMount() {
        this.loadKind();
        this.onAutoCompleteEvents();
        this.settingEditorTemplate();
    }

    /**
     * 스트립트 로드
     * @param name 스크립트 식별 이름
     * @param url 경로
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
     * 에디터 삽입
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
                    $(this).text("단축키 일람");
                } else {
                    $(this).after("<div class='cke_sc_def' />").next("div.cke_sc_def").load("${samplepcbUrl}/plugin/editor/smarteditor2/shortcut.html");
                    $(this).text("단축키 일람 닫기");
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
     * 텍스트 변경 이벤트
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
     * 종류, 분류 로드
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
     * 카테고리 변경 이벤트
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
     * 카테고리 변경
     * @param itemName 카테고리명
     * @param target 타켓
     */
    setKindInfoForCategory(itemName: string, target: number) {
        // 현재 카테고리 변경
        this.setCategory(itemName, target);
        // 하위 카테고리 변경
        if(target === 1) {
            const childKindInfo = this.setChildCategory(itemName, target + 1); // 중분류
            if(childKindInfo) {
                this.setChildCategory(childKindInfo[0].itemName, target + 2); // 소분류
            }
        }
        if(target === 2) {
            this.setChildCategory(itemName, target + 1); // 소분류
        }
    }

    /**
     * 하위 카테고리 변경
     * @param pItemName 부모 카테고리명
     * @param target 대상 타켓
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
     * 카테고리 변경
     * @param itemName 카테고리명
     * @param target 대성
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
     * 저장 요청
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
     * 저장하기
     * @param e
     */
    async save(e: React.MouseEvent<HTMLButtonElement>) {
        const item = this.state.item;

        // editor 내용 가져오기
        const contents_editor_data = oEditors.getById["contents"].getIR();
        oEditors.getById["contents"].exec("UPDATE_CONTENTS_FIELD", []);
        if ($.inArray(document.getElementById("contents").value.toLowerCase().replace(/^\s*|\s*$/g, ""), ["&nbsp;", "<p>&nbsp;</p>", "<p><br></p>", "<div><br></div>", "<p></p>", "<br>", ""]) != -1) {
            document.getElementById("contents").value = "";
        }
        if (contents_editor_data) {
            item.contents = contents_editor_data;
        }

        const response = await this.requestSave(item);
        const uploadReps = await this.requestUploadFile(response.data.id);
        if(uploadReps) {
            await this.requestSave(item);
        }
        const savedCallback = this.props.params.savedCallback;
        if(!savedCallback) {
            return;
        }
        savedCallback(response);
    }

    /**
     * 윈도우 팝업 중앙
     * @param w
     * @param h
     */
    browserPopupCenterFeatures(w, h) {
        const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
        const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
        return "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" + w + ", height=" + h + ", top=" + y + ", left=" + x;
    }

    /**
     * 다운로드
     * @param pathToken
     */
    downloadLink(pathToken: string): string {
        return this.props.params.fileServerApiUrl + '/host/' + pathToken;
    }

    /**
     * 자동완성 이벤트
     */
    onAutoCompleteEvents(): void {
        this.onAutoCompleteCategoryEvent("partName");
        this.onAutoCompleteEvent("manufacturerName", 4);
        this.onAutoCompleteEvent("partsPackaging", 7);
        this.onAutoCompleteEvent("packaging", 5);
    }

    /**
     * 모델명 자동완성 이벤트
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
                // 카테고리
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
                            // 현재 카테고리
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
                            categoryNameInfo[i] = { selectedItemName: findCategoryName }; // 선택된 카테고리 저장
                            if(i === 1) {
                                continue;
                            }
                            // 부모 카테고리 찾기
                            const pKind = kindInfo[i - 1];
                            const pKindKind = ((pId) => {
                                return $.grep(pKind, (pD) => {
                                    return pD.id === pId;
                                });
                            })(findKind[0].pId);
                            findCategoryName = undefined
                            if(pKindKind && pKindKind.length !== 0) {
                                findCategoryName = pKindKind[0].itemName;
                                categoryNameInfo[i].pItemName = pKindKind[0].itemName; // 부모 카테고리명 저장
                            }
                        }

                    }
                }
                // 선택된 카테고리명 세팅 및 선택박스 분류
                for (let j = 1; j <= 3; j++) {
                    if (categoryNameInfo[j]) {
                        const category = categoryNameInfo[j];
                        if(category.selectedItemName) {
                            this.setKindInfoForCategory(category.selectedItemName, j);
                        }
                    }
                }

                const item = { ...that.state.item }
                // 제품사양
                if(receiveItem.part.short_description) {
                    item.description = receiveItem.part.short_description;
                }
                // 제조사
                if(receiveItem.part.manufacturer) {
                    item.manufacturerName = receiveItem.part.manufacturer.name;
                }
                // 포장단위
                if(receiveItem.part.sellers && receiveItem.part.sellers.offers && receiveItem.part.sellers.offers.packaging) {
                    item.packaging = receiveItem.part.sellers.offers.packaging;
                }
                // 최소판매수량
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
     * 자동완성 이벤트
     * @param name 엘리먼트 이름 attr
     * @param target  타켓번호
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
     * 파일 선택 이벤트
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
     * 업로드 요청
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

    public render() {
        const item = this.state.item;
        const images = this.state.images;
        const kindInfo = this.state.kindInfo;
        return (
            <div id="app">
                <form name="partsForm" className="w-full max-w-6xl">
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="largeCategory">
                                대분류
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <select onChange={(event) => this.onChangeCategory(event, 1)} value={item.largeCategory}>
                                {kindInfo[1]?.map((kind, index) => (
                                    <option key={kind.id} value={kind.itemName}>{kind.displayName || kind.itemName}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="mediumCategory">
                                중분류
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <select onChange={(event) => this.onChangeCategory(event, 2)} value={item.mediumCategory}>
                                {kindInfo[2]?.map((kind, index) => (
                                    <option key={kind.id} value={kind.itemName}>{kind.displayName || kind.itemName}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="smallCategory">
                                소분류
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <select onChange={(event) => this.onChangeCategory(event, 3)} value={item.smallCategory}>
                                {kindInfo[3]?.map((kind, index) => (
                                    <option key={kind.id} value={kind.itemName}>{kind.displayName || kind.itemName}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="partName">
                                모델명
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.partName}
                                   name="partName"
                                   onChange={(event) => this.onChangeText(event)}/>
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="description">
                                제품사양
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.description}
                                   name="description"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="manufacturerName">
                                제조사
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.manufacturerName}
                                   name="manufacturerName"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="partsPackaging">
                                부품패키지
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.partsPackaging}
                                   name="partsPackaging"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="packaging">
                                포장단위
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.packaging}
                                   name="packaging"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="moq">
                                최소판매수량
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.moq}
                                   name="moq"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="price1">
                                단가(1~9)
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.price1}
                                   name="price1"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="price2">
                                단가(10~99)
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.price2}
                                   name="price2"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="price3">
                                단가(100~499)
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.price3}
                                   name="price3"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="price4">
                                단가(500~999)
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.price4}
                                   name="price4"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="price5">
                                단가(1000~)
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.price5}
                                   name="price5"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="inventoryLevel">
                                재고
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.inventoryLevel}
                                   name="inventoryLevel"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="images">
                                제품사진
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            {/*{item.images && item.images.length !== 0 && item.images.map((image, index) => (
                                <a href={this.downloadLink(image.pathToken)}>{image.originFileName}</a>
                            ))}*/}
                            {images && images.length !== 0 && images.map((image, index) => (
                                <div key={index}>
                                    <input type="file"
                                            name={image.originFileName}
                                            onChange={(event) => this.onChangeFile(event, image)} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="managerPhoneNumber">
                                담당자 연락처
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.managerPhoneNumber}
                                   name="managerPhoneNumber"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="managerName">
                                담당자명
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.managerName}
                                   name="managerName"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="managerEmail">
                                담당자 이메일
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <input className="sp-pkf-input" type="text" value={item.managerEmail}
                                   name="managerEmail"
                                   onChange={(event) => this.onChangeText(event)} />
                        </div>
                    </div>
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="contents">
                                제품 내용
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <div id="editor" />
                        </div>
                    </div>
                    {item.specs && item.specs.length !== 0 && (
                    <div className="md:flex md:items-center mb-6">
                        <div className="md:w-1/3">
                            <label className="sp-pkf-label"
                                   htmlFor="contents">
                                제품 스팩
                            </label>
                        </div>
                        <div className="md:w-2/3">
                            <ul>
                            {item.specs && item.specs.map((spec) =>(
                                <li>{spec.attribute.name} : {spec.display_value}</li>
                            ))}
                            </ul>
                        </div>
                    </div>
                    )}
                </form>
                <button className="sp-btn-primary" onClick={(event) => this.save(event)}>등록</button>
            </div>
        );
    }
}

declare let module: Record<string, unknown>;

export default hot(module)(PartsKindForm);
