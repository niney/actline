import * as React from "react";
import { hot } from "react-hot-loader";
import "./../assets/scss/MemberForm.scss";
import { MemberFormParam } from "../member-form-app";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useFieldArray, useForm } from "react-hook-form";
import { BankList } from "../pojo/bank-list";
import { LOGIN_BY_ID_MUTATION, LOGIN_MUTATION, ME_QUERY } from "../gql/member-gql";
import { loginMutation, loginMutationVariables } from "../__generated__/loginMutation";
import { meQuery } from "../__generated__/meQuery";
import { Simulate } from "react-dom/test-utils";
import { authTokenVar, isLoggedInVar } from "../pcb-apollo";
import { useEffect } from "react";
import { loginByIdMutation, loginByIdMutationVariables } from "../__generated__/loginByIdMutation";
import { LoginByIdInput } from "../__generated__/globalTypes";
// import { authTokenVar, isLoggedInVar } from "../pcb-apollo";

declare const $: any;

type State = {
}

type Certificate = {
    name?: string;
    image?: any;
}

type MemberItem = {
    introduce?: string;
    career?: string;
    certificateList?: Array<Certificate>;
    callTime?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    address?: string;
    distance?: string;
}

const UserForm = () => {
    const { loading: meLoading, data: user, error: userError } = useQuery<meQuery>(ME_QUERY);
    if (!user || meLoading || userError) {
        console.log(1, user);
        return (<div>not</div>)
    } else {
        console.log(2, user);
        return (<div>ok</div>)
    }
}

export const MemberForm = (props: { params: MemberFormParam }) => {

    /*const [memberItem, setMemberItem] = useState<MemberItem>({accountNumber: "", accountHolder: ""});
    const onChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMemberItem({
            [e.target.name]: e.target.value
        });
    }*/

    // useEffect(() => {
    //     // You need to restrict it at some point
    //     // This is just dummy code and should be replaced by actual
    //
    // }, []);

    const {
        control,
        register,
        getValues,
        // errors,
        handleSubmit,
        formState,
    } = useForm<MemberItem>({
        mode: "onChange",
    });

    const getFieldArray = (name) => {
        // const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
        const certificateList = useFieldArray({
            control,
            name: name,
        });
        // console.log(certificateList);
        return certificateList;
    }

    let certificateList = getFieldArray("certificateList");

    const addCertificate = () => {
        certificateList.append({ name: "", image: "" });
    }

    // const { data, loading } = useQuery(CATEGORIES_QUERY, {
    //     variables: {
    //         input: {
    //             parent: 0,
    //         },
    //     },
    // });


    const [
        loginMutation, {
            data: loginMutationResult, loading,
        }] = useMutation<loginByIdMutation, loginByIdMutationVariables>(LOGIN_BY_ID_MUTATION);

    const [getUser, { loading: meLoading, data: meData, error: meError }] = useLazyQuery<meQuery>(ME_QUERY);

    (async () => {
        if(!loginMutationResult && !loading) {
            const result = await loginMutation({
                variables: {
                    loginByIdInput: {
                        userId: 'tester2'
                    }
                }
            });
            authTokenVar(result.data.loginById.token);
            isLoggedInVar(true);
            getUser();
        }
        if (!meLoading && meData) {
            console.log(meData);
        }
    })();

    const onSubmit = () => {
        // const [
        //     creatAccountMutation,
        //     { loading, data: createAccountMutationResult },
        // ] = useMutation<createAccountMutation, createAccountMutationVariables>(CREATE_ACCOUNT_MUTATION);
        //
        // const values = getValues();
        // console.log(values);
        //
        // const userId = 'tester2';
        // const name = 'tester2';
        // const password = '1';
        // const phone = '1';
        //
        // creatAccountMutation({
        //     variables: {
        //         createAccountInput: { userId, name, password, phone },
        //     }
        // }).then((fetchResult) => {
        //     // console.log(fetchResult.data.createAccount);
        // })
    }

    // const isLoggedIn = useReactiveVar(isLoggedInVar)
    // UserForm();

    return (
        <div id="app">
            {/*{isLoggedIn && <UserForm />}*/}
            <form name="memberForm" className="w-full max-w-6xl" onSubmit={handleSubmit(onSubmit)}>
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-1/3">
                        <label className="sp-mf-label"
                               htmlFor="introduce">
                            내소개
                        </label>
                    </div>
                    <div className="md:w-2/3 border">
                        <textarea rows={5} cols={107} {...register("introduce")} />
                    </div>
                </div>
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-1/3">
                        <label className="sp-mf-label"
                               htmlFor="career">
                            경력
                        </label>
                    </div>
                    <div className="md:w-2/3 border">
                        <textarea rows={5} cols={107} {...register("career")} />
                    </div>
                </div>
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-1/3">
                        <label className="sp-mf-label"
                               htmlFor="certificate">
                            자격증
                        </label>
                    </div>
                    <div className="md:w-2/3">
                        <button type="button" onClick={addCertificate}>추가</button>
                        {certificateList.fields.map((c, index) => (
                            <div key={c.id} className="flex">
                                <input type="text" className="sp-mf-input"
                                       key={"name" + index} {...register(`certificateList.${index}.name`)}
                                       placeholder="자격증명" />
                                <input type="file" className="sp-mf-input"
                                       key={'image' + index} {...register(`certificateList.${index}.image`)} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-1/3">
                        <label className="sp-mf-label"
                               htmlFor="callTime">
                            연락 가능 시간
                        </label>
                    </div>
                    <div className="md:w-2/3">
                        <input type="text" className="sp-mf-input"
                               {...register("callTime")} />
                    </div>
                </div>
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-1/3">
                        <label className="sp-mf-label"
                               htmlFor="address">
                            업무지 주소
                        </label>
                    </div>
                    <div className="md:w-2/3">
                        <input type="text" className="sp-mf-input"
                               {...register("address")} />
                    </div>
                </div>
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-1/3">
                        <label className="sp-mf-label"
                               htmlFor="distance">
                            이동 가능 거리
                        </label>
                    </div>
                    <div className="md:w-2/3">
                        업무지로 부터&nbsp;
                        <select {...register("distance")} className="border">
                            <option key="1" value="2Km">2Km</option>
                            <option key="2" value="5Km">5Km</option>
                            <option key="3" value="10Km">10Km</option>
                            <option key="4" value="25Km">25Km</option>
                            <option key="5" value="50Km">50Km</option>
                            <option key="6" value="100Km">100Km</option>
                            <option key="7" value="전국">전국</option>
                        </select>
                    </div>
                </div>
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-1/3">
                        <label className="sp-mf-label">
                            수금계좌
                        </label>
                    </div>
                    <div className="md:w-2/3 flex">
                        <input {...register("accountHolder")}
                               type="text" className="sp-mf-input" placeholder="예금주" />
                        <select {...register("bankName")} className="border">
                            {BankList.map((bank, index) => (
                                <option key={index} value={bank.value}>{bank.name}</option>
                            ))}
                            <option value="">국민은행</option>
                        </select>
                        <input {...register("accountNumber")}
                               type="text" className="sp-mf-input" placeholder="계좌번호" />
                    </div>
                </div>
                <button type="submit">등록</button>
            </form>
        </div>
    )
}

declare let module: Record<string, unknown>;

export default hot(module)(MemberForm);
