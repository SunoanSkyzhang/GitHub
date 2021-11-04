/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/search", "N/record","N/runtime", "../common/core"],
    (search, record,runtime,core) => {
        const beforeLoad = (scriptContext) => {
        }
        const beforeSubmit = (scriptContext) => {
            aaa
            var type = scriptContext.type
            var newRec = scriptContext.newRecord
            if(type == 'create'){
                var salesOrder=newRec.getValue('custevent_case_sales_order');
                var caseStatus=newRec.getValue('status');
                var caseCancelres=newRec.getValue('custevent_case_refund_response');
                var caseRMACode=newRec.getValue('custevent_dh_rma_rma_num');
                if(salesOrder && caseStatus == 1 && !caseCancelres && caseRMACode){
                    var responseCode = {"error": "未发送请求!"};
                    var status=1;
                    try {
                        core.erp.getAccountList().map(function (account) {
                            var soResult = search.lookupFields({
                                type: "salesorder",
                                id: salesOrder,
                                columns: ["custbody_yc_order_code"]
                            });
                            var ycOrderCode = soResult["custbody_yc_order_code"];
                            var params = {"saleOrderCode":ycOrderCode,"targetStatus":7};
                            var paramsJson = JSON.stringify(params);
                            var response = core.erp.execute(account, "cancelOrder", paramsJson);
                            log.debug(' response', response);
                            if (response.code == 200) {
                                responseCode=JSON.stringify(response.data);
                                status=2;
                            } else {
                                responseCode=JSON.stringify(response.error);
                                status=1;
                            }
                        });
                        updateCancelResponse(status,responseCode,salesOrder,newRec);
                    } catch (ex) {
                        log.debug('发生错误', ex.message);
                        updateCancelResponse(1,ex.message,salesOrder,newRec);
                    }
                }
            }
        }

        const afterSubmit = (scriptContext) => {

        }

        function  updateCancelResponse(status,response,salesOrder,newRec){
            newRec.setValue("custevent_case_platform_operation_statu", status);
            newRec.setValue("custevent_case_refund_response", response);
            record.submitFields({
                type: "salesorder",
                id: salesOrder,
                values: {
                    custbody_dh_yc_cut_off_status: status,
                    custbody_dh_yc_cut_off_response:response
                }
            });
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    }
);
