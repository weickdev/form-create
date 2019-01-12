import {deepExtend, extend, isUndef, toString, uniqueId} from "../core/util";
import VNode from "../factory/vNode";
import VData from "../factory/vData";

export function preventDefault(e) {
    e.preventDefault();
}

export default class Form {

    constructor({vm, options, fieldList, handlers, formData, validate, fCreateApi}) {
        this.vm = vm;
        this.options = options;
        this.handlers = handlers;
        this.renderSort = fieldList;
        this.form = {
            model: formData,
            rules: validate,
            key: 'form' + uniqueId()
        };
        this.fCreateApi = fCreateApi;
        this.vNode = new VNode(vm);
        this.vData = new VData();
        this.unique = uniqueId();
        this.refName = `cForm${this.unique}`;
        this.cacheUnique = 0;
    }

    getRender(field) {
        return this.handlers[field].render;
    }

    parse(vm) {
        this.vNode.setVm(vm);
        if (!vm.isShow)
            return;
        if (this.cacheUnique !== vm.unique) {
            this.renderSort.forEach((field) => {
                this.getRender(field).clearCache();
            });
            this.cacheUnique = vm.unique;
        }
        let unique = this.unique,
            propsData = this.vData.props(this.options.form).props(this.form)
                .ref(this.refName).nativeOn({submit: preventDefault}).class('form-create', true).key(unique).get(),
            vn = this.renderSort.map((field) => {
                let render = this.getRender(field), {key, type} = render.handler;
                if (type === 'hidden') return;
                return this.makeFormItem(render.handler, render.cacheParse(), `fItem${key}${unique}`);

            });
        if (vn.length > 0)
            vn.push(this.makeFormBtn(unique));
        return this.vNode.form(propsData, [this.vNode.row(extend({props: this.options.row || {}}, {key: 'row' + unique}), vn)]);
    }

    makeFormItem({rule, unique, field, refName}, VNodeFn, fItemUnique) {
        let className = rule.className, propsData = this.vData.props({
            prop: field,
            label: rule.title,
            labelFor: unique,
            rules: rule.validate,
            labelWidth: rule.col.labelWidth,
            required: rule.props.required
        }).key(fItemUnique).ref('fItem' + refName).class(className).get();
        return this.vNode.col({
            props: rule.col, 'class': {
                '__fc_h': rule.props.hidden === true,
                '__fc_v': rule.props.visibility === true
            }, key: `${fItemUnique}col1`
        }, [this.vNode.formItem(propsData, VNodeFn)]);
    }

    makeFormBtn(unique) {
        let btn = [],
            submitBtnShow = false !== this.vm.buttonProps && false !== this.vm.buttonProps.show,
            resetBtnShow = false !== this.vm.resetProps && false !== this.vm.resetProps.show;
        if (submitBtnShow)
            btn.push(this.makeSubmitBtn(unique, resetBtnShow ? 19 : 24));
        if (resetBtnShow)
            btn.push(this.makeResetBtn(unique, 4));

        return this.vNode.col({props: {span: 24}, key: `${this.unique}col2`}, btn);
    }

    makeResetBtn(unique, span) {
        const props = isUndef(this.options.resetBtn.col) ? {span: span, push: 1} : this.options.resetBtn.col;
        return this.vNode.col({props: props, key: `${this.unique}col3`}, [
            this.vNode.button({
                key: `frsbtn${unique}`, props: this.vm.resetProps, on: {
                    "click": () => {
                        this.fCreateApi.resetFields();
                    }
                }
            }, [this.vm.resetProps.innerText])
        ]);
    }

    makeSubmitBtn(unique, span) {
        const props = isUndef(this.options.submitBtn.col) ? {span: span} : this.options.submitBtn.col;
        return this.vNode.col({props: props, key: `${this.unique}col4`}, [
            this.vNode.button({
                key: `fbtn${unique}`, props: this.vm.buttonProps, on: {
                    "click": () => {
                        this.fCreateApi.submit();
                    }
                }
            }, [this.vm.buttonProps.innerText])
        ]);
    }

}
