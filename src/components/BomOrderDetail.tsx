import * as React from "react";
import { hot } from "react-hot-loader";
import { BomOrderDetailParam } from "../bom-order-detail-app";
import "air-datepicker/air-datepicker.css";
import AirDatepicker from "air-datepicker";
import localeKo from "air-datepicker/locale/ko";

declare const $: any;
declare const bomAnalysisCommon: any;
declare const BomAnalysisEx: any;
declare const pcbEstimateLib: any;
declare const GerberCart: any;

type State = {
	items?: Array<any>;
	gbCompany?: any;
	selectedCompanyName?: string;
	cart: any;
	amount: number;
	totalPriceCurrency: string;
}

class BomOrderDetail extends React.Component<Record<any, BomOrderDetailParam>, State> {

	private bomAnalysisEx;
	private changePartItem: any;
	private changePartItemIndex: any;
	private kindInfo = {};
	private kindNameMap = {};

	constructor(props: Readonly<Record<any, BomOrderDetailParam>> | Record<any, BomOrderDetailParam>) {
		super(props);
		this.state = {
			items: undefined,
			gbCompany: {},
			selectedCompanyName: undefined,
			cart: {},
			amount: 0,
			totalPriceCurrency: "0",
		}
		this.init();
		document.addEventListener('keydown', (event) => {
			// Ctrl + S
			if (event.ctrlKey && event.key === 's') {
				event.preventDefault(); // 기본 동작을 막음
				this.saveBom(this.state.items);
			}
		});
	}

	componentDidUpdate(prevProps: Readonly<Record<any, BomOrderDetailParam>>, prevState: Readonly<State>, snapshot?: any) {
		const that = this;
		if (!prevState.items) {
			$.each($("[name=orderDate]"), function() {
				new AirDatepicker(this, {
					locale: localeKo,
					dateFormat: "yyyy-MM-dd",
					onSelect({ date, formattedDate, datepicker }) {
						that.state.items[parseInt(datepicker.$el.getAttribute("data-date-idx"))].orderDate = formattedDate;
					},
				});
			});
			$.each($("[name=stockingDate]"), function() {
				new AirDatepicker(this, {
					locale: localeKo,
					dateFormat: "yyyy-MM-dd",
					onSelect({ date, formattedDate, datepicker }) {
						that.state.items[parseInt(datepicker.$el.getAttribute("data-date-idx"))].stockingDate = formattedDate;
					},
				});
			});

			$("[name=providerName]").each(function(index, item) {
				this.value = $(this).attr('data-company-name') || '';
			});
		}
		if (prevState.selectedCompanyName !== this.state.selectedCompanyName) {
			this.allCheck(this.state.selectedCompanyName !== undefined);
		}
	}

	async init() {
		const that = this;
		await this.loadScript();

		this.bomAnalysisEx = new BomAnalysisEx({
			xpServerApiUrl: this.props.params.xpServerApiUrl,
			mlServerApiUrl: this.props.params.mlServerApiUrl,
			fileServerApiUrl: this.props.params.fileServerApiUrl
		})
		this.bomAnalysisEx.loadCart = (param) => {
			return $.get(that.props.params.samplepcbUrl + '/shop/cart_api.php?w=rc&caId=40&' + $.param(param));
		}
		const { cartResponse, itemList }: any = await this.bomAnalysisEx.loadBomList(this.props.params.itId, true);
		for (const item of itemList) {
			if (bomAnalysisCommon.orCheckStatus(item, bomAnalysisCommon.status.orNotStock)) {
				item.status = "재고없음";
			}
			bomAnalysisCommon.initParts(item);
		}
		this.setState({
			cart: cartResponse.data[0],
			amount: cartResponse.data[0].qty,
			items: itemList
		});
		this.settingCompanyNameFilter();
		// bom 팝업 콜백 이벤트
		window.addEventListener("message", function(event) {
			if (event.data && event.data.item) {
				that.execChangeParts(event);
			}
		}, false);
		// 가격 계산
		this.calcAllPrice();
		// 카테고리 불러오기
		this.loadCategory();
	}

	private async loadCategory() {
		const response = await $.get(this.props.params.xpServerApiUrl + '/pcbKind/_search?size=1000000000');
		if (!response.result) {
			return;
		}
		const kindResult = response.data;
		this.kindInfo = {};
		for (var kind of kindResult) {
			this.kindNameMap[kind.itemName] = kind;
			if (!this.kindInfo[kind.target]) {
				this.kindInfo[kind.target] = [];
			}
			this.kindInfo[kind.target].push(kind);
		}
	}

	private settingCompanyNameFilter() {
		const itemList = this.state.items;
		const gbCompany = {};
		for (const item of itemList) {
			if (item.part.sellers && item.part.sellers.company) {
				let companyName = item.part.sellers.company.name;
				if (!companyName) {
					companyName = "없음";
				}
				const price = bomAnalysisCommon.calcPrice(item);
				if (gbCompany[companyName]) {
					gbCompany[companyName].len++;
					gbCompany[companyName].totalPrice += price;
				} else {
					gbCompany[companyName] = {
						name: companyName,
						len: 1,
						totalPrice: price
					};
				}
			}
		}
		this.setState({
			gbCompany: gbCompany
		});
	}

	loadScript(): Promise<boolean> {
		if ($('script[src*="bom.analysis.common.js"]').length !== 0) {
			return;
		}
		return new Promise(resolve => {
			let bomScript = document.createElement("script");
			bomScript.src = this.props.params.samplepcbUrl + "/js/bom.analysis.common.js";
			bomScript.async = true;
			document.body.appendChild(bomScript);
			const bomExScript = document.createElement("script");
			bomExScript.src = this.props.params.samplepcbUrl + "/js/module/bom-analysis-ex.js";
			bomExScript.async = true;
			bomScript.onload = () => {
				document.body.appendChild(bomExScript);
				bomExScript.onload = () => {
					resolve(true);
				}
			}
			let pcbEstimateLibScript = document.createElement("script");
			pcbEstimateLibScript.src = this.props.params.samplepcbUrl + "/js/pcb.estimate.lib.js";
			pcbEstimateLibScript.async = true;
			document.body.appendChild(pcbEstimateLibScript);

			let gerberCartScript = document.createElement("script");
			gerberCartScript.src = this.props.params.samplepcbUrl + "/gerber_api/js/gerber_cart.js";
			gerberCartScript.async = true;
			document.body.appendChild(gerberCartScript);

			let iaoAlertScript = document.createElement("script");
			iaoAlertScript.src = this.props.params.samplepcbUrl + "/js/lib/iao-alert.jquery.min.js";
			iaoAlertScript.async = true;
			document.body.appendChild(iaoAlertScript);

			const iaoAlertLink = document.createElement('link');
			iaoAlertLink.rel = 'stylesheet';
			iaoAlertLink.href = this.props.params.samplepcbUrl + "/css/lib/iao-alert.min.css";
			document.head.appendChild(iaoAlertLink);

		});
	}

	async saveBom(items: any) {
		var id = this.props.params.itId;
		var setParams = [];
		for (const item of this.state.items) {
			if (item.part && item.part.specs) {
				delete item.part.specs; // specs 은 제외하고 저장
				delete item.part.sellersAll; // sellersAll 제외하고 저장
			}
		}
		setParams.push({ name: 'it_explan', value: JSON.stringify(this.state.items) });
		setParams.push({ name: 'it_explan2', value: JSON.stringify(this.state.items) });
		const response = await pcbEstimateLib.updateBomEstimate(id, setParams);
		const cart = this.state.cart;
		const itemData = GerberCart.updateBomItem(cart.it_id, cart.it_name, this.state.totalPriceCurrency.replace(/,/g, ''), this.state.amount, cart.it_23, items);
		const gerberCartResponse = await GerberCart.createItemAndSendCart(itemData.it_id, itemData.it_name, itemData);
		if (response.result) {
			// alert("저장완료");
			$.iaoAlert({
				msg: "저장완료",
				type: "notification",
				mode: "dark",
			});
		}
	}

	onChangeAmount(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, stateName: 'amount') {
		if (stateName === "amount") {
			if (parseInt(e.target.value) < 1) {
				return;
			}
			this.calcAllPrice(e.target.value);
		}
		this.setState({
			[stateName]: parseInt(e.target.value)
		});
	}

	onChangeText(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, item: any) {
		item[e.target.name] = e.target.value;
		this.setState({
			items: this.state.items
		});
	}

	onChangeTextForPrice(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, item: any) {
		item[e.target.name] = e.target.value;
		this.calcAllPrice();
		this.settingCompanyNameFilter();
		this.setState({
			items: this.state.items
		});
	}

	onChangeTextForUnitPrice(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, item: any) {
		item.part.unitPrice = e.target.value;
		if (item.part.sellers && item.part.sellers.offers) {
			if (item.part.sellers.offers.prices) {
				item.part.sellers.offers.pricesBackup = item.part.sellers.offers.prices;
			}
			delete item.part.sellers.offers.prices;
		}
		this.calcAllPrice();
		this.settingCompanyNameFilter();
		this.setState({
			items: this.state.items
		});
	}
	onChangeTextForCompanyName(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, item: any) {
		item.part.sellers.company.name = e.target.value;
		this.setState({
			items: this.state.items
		});
	}
	onEnterTextForCompanyName(e: React.KeyboardEvent<HTMLInputElement> | any, item: any) {
		if (e.key !== "Enter") {
			return;
		}
		item.part.sellers.company.name = e.target.value;
		this.setState({
			items: this.state.items
		});
		this.settingCompanyNameFilter();
	}

	onChangeTextForAllCompanyName(e: React.KeyboardEvent<HTMLInputElement> | any) {
		if (e.key !== "Enter") {
			return;
		}
		this.settingMultipleValue(item => {
			item.part.sellers.company.name = e.target.value;
		});
		this.settingCompanyNameFilter();
	}

	onChangeTextForAllValue(e: React.KeyboardEvent<HTMLInputElement> | any, propertyName: string) {
		if (e.key !== "Enter") {
			return;
		}
		this.settingMultipleValue(item => {
			item[propertyName] = e.target.value;
		});
		this.settingCompanyNameFilter();
	}

	onChangeSelectForAllValueOrderStatus(e: React.KeyboardEvent<HTMLInputElement> | any) {
		this.settingMultipleValue((item, i) => {
			$(`[data-order-status-select-idx=${i}]`).val(e.target.value);
		});
		this.settingCompanyNameFilter();
	}

	selectCompanyName(selectedCompanyName: string) {
		if (selectedCompanyName == '전체') {
			selectedCompanyName = undefined;
		}
		this.setState({
			selectedCompanyName: selectedCompanyName,
		});
	}

	allCheck(checked: boolean) {
		$('#allCheck').prop('checked', checked);
		this.allCheckEvent(checked);
	}

	allCheckEvent(checked: boolean) {
		const items = this.state.items;
		const selectedCompanyName = this.state.selectedCompanyName;
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (selectedCompanyName) {
				if (item.part && item.part.sellers && item.part.sellers.company
					&& selectedCompanyName === item.part.sellers.company.name && checked) {
					$(`[data-check-idx=${i}]`).prop('checked', checked);
				} else {
					$(`[data-check-idx=${i}]`).prop('checked', false);
				}
				if (selectedCompanyName === "없음" && item.part.sellers.company.name === undefined) {
					$(`[data-check-idx=${i}]`).prop('checked', checked);
				}
			} else {
				$(`[data-check-idx=${i}]`).prop('checked', checked);
			}

		}
		this.setState({
			items: items
		});
	}

	settingMultipleValue(applyCallback) {
		const items = this.state.items;
		const selectedCompanyName = this.state.selectedCompanyName;
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const isChecked = $(`[data-check-idx=${i}]`).prop("checked");
			if (isChecked) {
				applyCallback(item, i);
			}
		}
		this.setState({
			items: items
		});
	}
	private browserPopupCenterFeatures(w, h) {
		var y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
		var x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
		return "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" + w + ", height=" + h + ", top=" + y + ", left=" + x;
	}

	private popupBomParts(partNumber = '', qty = 1, mode) {
		window.open(this.props.params.samplepcbUrl + '/shop/bom_analysis_parts.php?partNumber=' + partNumber + '&qty=' + qty + '&mode=' + mode, 'partForm', this.browserPopupCenterFeatures(1300, 876));
	}

	private popupBomPartsById(id = '', partNumber, qty = 1, mode) {
		window.open(this.props.params.samplepcbUrl + '/shop/bom_analysis_parts.php?id=' + id + '&partNumber=' + partNumber + '&qty=' + qty + '&mode=' + mode, 'partForm', this.browserPopupCenterFeatures(1300, 876));
	}

	openPopupBomByPartsId(item: any, index: number) {
		this.changePartItem = item;
		this.changePartItemIndex = index;
		if (item.part.id) {
			this.popupBomPartsById(encodeURIComponent(item.part.id), item[2], item.originPurchaseStock, 'editSellers');
		}
	}

	openPopupBomBySearch(item: any, index: number) {
		this.changePartItem = item;
		this.changePartItemIndex = index;
		this.popupBomParts(encodeURIComponent(item[2]), item.originPurchaseStock, "edit");
	}

	async saveOctopartToSamplepcb(receiveItem: any) {
		const item = {
			status: 1,
			token: '7025cd62f74111eb9a030242ac130003'
		};
		bomAnalysisCommon.makeConvertSameplcpcb(item, receiveItem, this.kindNameMap, this.kindInfo);
		const response = await $.ajax({
			method: 'POST',
			url: this.props.params.xpServerApiUrl + '/pcbParts/_indexing',
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify(item)
		});
		receiveItem.part.id = response.data.id;
		this.setState({
			items: this.state.items
		});
	}

	execChangeParts(event) {
		const item = JSON.parse(event.data.item);
		bomAnalysisCommon.initParts(item);
		item[2] = item.part.mpn; // mpn 변경
		if (item[2]) {
			if (this.changePartItem.part.id === item.part.id
				&& this.changePartItem.part
				&& this.changePartItem.part.sellers
				&& this.changePartItem.part.sellers.company.name === item.part.sellers.company.name) {
				// 같은 부품 인경우는 패스
				return this.changePartItem;
			}
			// part number 변경
			this.changePartItem[2] = item[2];
		}
		if (item.part) {
			// part 정보 변경
			this.changePartItem.part = item.part;
		}
		if (parseInt(item[4]) < item.part.sellers.offers.moq) {
			this.changePartItem[4] = item.part.sellers.offers.moq;
			this.changePartItem.purchaseStock = item.part.sellers.offers.moq;
		} else {
			this.changePartItem.originPurchaseStock = item.originPurchaseStock || item[4];
			this.changePartItem[4] = this.changePartItem.originPurchaseStock;
			this.changePartItem.purchaseStock = this.changePartItem.originPurchaseStock;
		}
		this.changePartItem.addStock = 0;
		if (item.workStatus) {
			this.changePartItem.workStatus = item.workStatus;
		}
		if (this.changePartItem.isPartToRef) {
			delete this.changePartItem.isPartToRef;
		}
		// 공급업체명은 특별 처리
		$(`[data-first-idx=${this.changePartItemIndex}]`).find("[name=providerName]").val(item.part.sellers.company.name);

		// part 가 없거나 가격 초기화가 안되어 있다면 초기화
		if (!this.changePartItem.part) {
			this.changePartItem.part = {};
		}
		if (!this.changePartItem.part.unitPrice) {
			this.changePartItem.part.unitPrice = 0;
		}
		if (!this.changePartItem.part.calcPrice) {
			this.changePartItem.part.calcPrice = 0;
		}

		this.setState({
			items: this.state.items
		});
	}

	selectedIsSameCompany(item: any) {
		const selectedCompanyName = this.state.selectedCompanyName;
		return (!selectedCompanyName
			|| (selectedCompanyName === item.part.sellers.company.name)
			|| (selectedCompanyName === "없음" && item.part.sellers.company.name === undefined));
	}

	private calcAllPrice(amount = undefined) {
		const itemList = this.state.items;
		let totalPrice = 0;
		for (const item of itemList) {
			this.calcDefPurchaseAndAddStock(item, amount);
			const price = bomAnalysisCommon.calcPrice(item);
			totalPrice += price;
			item.calcPriceCurrency = bomAnalysisCommon.currency(price);
		}
		this.setState({
			items: itemList,
			totalPriceCurrency: bomAnalysisCommon.currency(totalPrice)
		});
	}

	private calcDefPurchaseAndAddStock(item, amount) {
		if (!amount) {
			return;
		}
		if (!item[4]) {
			item[4] = 0;
		}
		if (!item.addStock) {
			item.addStock = 0;
		}
		var psAmount = parseInt(item[4]) * parseInt(amount.toString());
		var purchaseStock = psAmount + parseInt(item.addStock);
		if (item.part && item.part.sellers && item.part.sellers.offers) {
			var inventory = item.part.sellers.offers.inventory_level; // 재고
			var moq = item.part.sellers.offers.moq; // 최소구매 수량
			if (moq > 1) {
				// 최소구매 수량이 1개 이상인 세트는 수동으로 설정
				psAmount = parseInt(item[4]);
				purchaseStock = psAmount + parseInt(item.addStock);
			}
			if (moq > purchaseStock) {
				// 최소구매 수량보다 구매수량이 작은경우
				purchaseStock = moq;
				item.addStock = purchaseStock - psAmount;
				item.isAddStock = true; // 추가 수량 세팅 여부
			}
		}
		item.purchaseStock = purchaseStock;
	}

	downloadExcel() {
		const items = this.state.items;
		const form = $('<form/>',
			{ method: 'post', action: this.props.params.xpServerApiUrl + '/bom/orderDetail/_downloadExcel', target: '_blank' }
		).append($('<input>', { type: 'hidden', name: 'itId', value: this.props.params.itId }));
		const send = []
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			form
				.append($('<input>', { type: 'hidden', name: 'bomItemList[' + i + '].partName', value: item.part.name }))
				.append($('<input>', { type: 'hidden', name: 'bomItemList[' + i + '].imageUrl', value: item.part.best_image.url }))
				.append($('<input>', { type: 'hidden', name: 'bomItemList[' + i + '].moq', value: item.part.sellers.offers.moq }))
				.append($('<input>', { type: 'hidden', name: 'bomItemList[' + i + '].purchaseStock', value: item.purchaseStock }))
				.append($('<input>', { type: 'hidden', name: 'bomItemList[' + i + '].unitPrice', value: item.part.unitPrice }))
				.append($('<input>', { type: 'hidden', name: 'bomItemList[' + i + '].calcPrice', value: item.part.calcPrice }))
				.append($('<input>', { type: 'hidden', name: 'bomItemList[' + i + '].providerName', value: item.part.sellers.company.name }))
				.append($('<input>', { type: 'hidden', name: 'bomItemList[' + i + '].orderDate', value: item.orderDate }))
				.append($('<input>', { type: 'hidden', name: 'bomItemList[' + i + '].stockingDate', value: item.stockingDate }))
				.append($('<input>', { type: 'hidden', name: 'bomItemList[' + i + '].orderStatus', value: item.orderStatus }))
			;
		}
		form.appendTo('body').submit().remove();
	}

	public render() {
		const { items, gbCompany, selectedCompanyName, amount, totalPriceCurrency } = this.state;
		if (!items) {
			return false;
		}
		const orderStatusOptions = <>
			<option value="미발주">미발주</option>
			<option value="발주">발주</option>
			<option value="입고대기">입고대기</option>
			<option value="입고">입고</option>
			<option value="배송">배송</option>
			<option value="완료">완료</option>
		</>;
		return (
			<div id="app">
				<div className="fixed flex bg-white">
					<div className="">
						<div className="inline-block mx-0.5 my-3">
							<button type="button"
									onClick={(event => {
										this.selectCompanyName("전체");
									})}
									className={(selectedCompanyName === undefined ? "bg-cyan-200 " : "") + "inline-block px-6 py-2 border-2 border-blue-600 text-blue-600 font-medium text-xs leading-tight uppercase rounded-full hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out"}>
								<div>전체({items.length})</div>
								({totalPriceCurrency}원)
							</button>
						</div>
						{gbCompany && Object.entries<any>(gbCompany).map(([key, item]) =>
							<React.Fragment key={key}>
								<div className="inline-block mx-0.5 my-3">
									<button type="button"
											onClick={(event => {
												this.selectCompanyName(item.name);
											})}
											className={(selectedCompanyName === item.name ? "bg-cyan-200 " : "") + "inline-block px-6 py-2 border-2 border-blue-600 text-blue-600 font-medium text-xs leading-tight uppercase rounded-full hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out"}>
										<div>{item.name}({item.len})</div> ({parseInt(item.totalPrice).toLocaleString()}원)
									</button>
								</div>
							</React.Fragment>,
						)}</div>
					<div className="ml-5 self-center">
						<p className="p-2 border inline-block">총액 : {totalPriceCurrency}</p>
						<p className="p-2 border inline-block">세트 : <input type="number" name="purchaseStock"
																		   value={amount}
																		   onChange={(event) => this.onChangeAmount(event, 'amount')}
																		   className="appearance-none rounded w-24 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" /></p>
					</div>
					<div className="ml-5 self-center">
						<button type="button"
								onClick={(event => {
									this.downloadExcel();
								})}
								className="inline-block px-6 py-2 border-2 border-blue-600 text-blue-600 font-medium text-xs leading-tight uppercase rounded hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0 transition duration-150 ease-in-out">
							다운로드
						</button>
					</div>
					<div className="ml-5 self-center">
						<button type="button"
								className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
								onClick={() => this.saveBom(items)}>
							저장하기
						</button>
						<span>※ ctrl + s 단축키 저장됩니다.</span>
					</div>
				</div>
				<div className="flex flex-col pt-16">
					<div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
						<div className="py-2 inline-block min-w-full sm:px-6 lg:px-8">
							<div className="overflow-hidden">
								<table className="min-w-full">
									<thead className="border-b-4">
									<tr>
										<th scope="col"
											className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
											<input type="checkbox" className="w-6 h-6 rounded" id="allCheck" onClick={(event: any) => this.allCheckEvent(event.target.checked)}/>
										</th>
										<th scope="col"
											className="text-sm font-bold text-gray-900 px-6 py-4 text-left">
											모델명
										</th>
										<th scope="col"
											className="text-sm font-bold text-gray-900 px-6 py-4 text-left">
											최소구매수량
										</th>
										<th scope="col"
											className="text-sm font-bold text-gray-900 px-6 py-4 text-left">
											구매수량
										</th>
										<th scope="col"
											className="text-sm font-bold text-gray-900 px-6 py-4 text-left">
											단가
										</th>
										<th scope="col"
											className="text-sm font-bold text-gray-900 px-6 py-4 text-left">
											합계
										</th>
										<th scope="col"
											className="text-sm font-bold text-gray-900 px-6 py-4 text-left">
											공급사
										</th>
										<th scope="col"
											className="text-sm font-bold text-gray-900 px-6 py-4 text-left">
											발주일
										</th>
										<th scope="col"
											className="text-sm font-bold text-gray-900 px-6 py-4 text-left">
											입고일
										</th>
										<th scope="col"
											className="text-sm font-bold text-gray-900 px-6 py-4 text-left">
											진행상태
										</th>
									</tr>
									<tr>
										<th></th>
										<th></th>
										<th></th>
										<th></th>
										<th></th>
										<th></th>
										<th scope="col"
											className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
											<input type="text"
												   onKeyPress={(event) => this.onChangeTextForAllCompanyName(event)}
												   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
										</th>
										<th scope="col"
											className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
											<input type="text"
												   autoComplete="off"
												   onKeyPress={(event) => this.onChangeTextForAllValue(event, 'orderDate')}
												   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
										</th>
										<th scope="col"
											className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
											<input type="text"
												   autoComplete="off"
												   onKeyPress={(event) => this.onChangeTextForAllValue(event, 'stockingDate')}
												   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
										</th>
										<th scope="col"
											className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
											<select name="orderStatus" onChange={(event) => this.onChangeSelectForAllValueOrderStatus(event)}
													className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
												{orderStatusOptions}
											</select>
										</th>
									</tr>
									</thead>
									<tbody>
									{items.map((item, index) => {
										const display = this.selectedIsSameCompany(item) ? "" : "hidden";
										return <React.Fragment key={index}>
											<tr className={display} data-first-idx={index}>
												<td rowSpan={2}
													className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
													<div>
														<label className="inline-flex items-center">
															<input type="checkbox" className="w-6 h-6 rounded"
																   data-check-idx={index} />
															<span className="ml-2">{index + 1}</span>
														</label>
													</div>
													<div className="mb-1">
														<button type="button"
																onClick={() => this.openPopupBomByPartsId(item, index)}
																className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">
															공급업체
														</button>
													</div>
													<div className="mb-1">
														<button type="button"
																onClick={() => this.openPopupBomBySearch(item, index)}
																className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">
															변경
														</button>
													</div>
													{item.part && item.part.id && !isNaN(Number(item.part.id)) &&
														<div>
															<button type="button"
																	onClick={() => this.saveOctopartToSamplepcb(item)}
																	className="inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">
																등록
															</button>
														</div>
													}
												</td>
												<td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
													{item[2]}
												</td>
												<td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
													{item.part.sellers.offers.moq}
												</td>
												<td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
													<input type="text" name="purchaseStock"
														   value={item.purchaseStock}
														   onChange={(event) => this.onChangeTextForPrice(event, item)}
														   className="shadow appearance-none border rounded w-24 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
												</td>
												<td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
													<input type="text" name="unitPrice"
														   value={item.part.unitPrice}
														   onChange={(event) => this.onChangeTextForUnitPrice(event, item)}
														   className="shadow appearance-none border rounded w-24 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
												</td>
												<td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
													{item.calcPriceCurrency}
												</td>
												<td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
													<input type="text" name="providerName" data-company-name={item.part.sellers.company.name}
														   onKeyPress={(event) => this.onEnterTextForCompanyName(event, item)}
														   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
												</td>
												<td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
													<input type="text" name="orderDate" data-date-idx={index}
														   autoComplete="off"
														   value={item.orderDate}
														   onChange={(event) => this.onChangeText(event, item)}
														   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
												</td>
												<td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
													<input type="text" name="stockingDate" data-date-idx={index}
														   autoComplete="off"
														   value={item.stockingDate}
														   onChange={(event) => this.onChangeText(event, item)}
														   className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
												</td>
												<td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
													<select data-order-status-select-idx={index}
															name="orderStatus"
															onChange={(event) => this.onChangeText(event, item)}
															className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
														{orderStatusOptions}
													</select>
												</td>
											</tr>
											<tr className={display + " border-b"}>
												<td colSpan={9}
													className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
													<div>
														{item.part.best_image.url &&
															(<>
																<img src={item.part.best_image.url} alt="img"
																	 width="60"
																	 className="inline-block mx-1" />
																<a href={item.part.best_image.url}
																   target="_blank">{item.part.best_image.url.substring(item.part.best_image.url.lastIndexOf("/") + 1)}</a>
															</>)}
													</div>
													{item.part.short_description}
													<div className="mt-2">
														메모 : <input type="text" name="memo" data-date-idx={index}
																value={item.memo}
																onChange={(event) => this.onChangeText(event, item)}
																className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
													</div>
												</td>
											</tr>
										</React.Fragment>;
									})}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};
}

declare let module: Record<string, unknown>;

export default hot(module)(BomOrderDetail);
