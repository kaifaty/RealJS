class Real{
    constructor(node, data){
        this._initCss();
        this.data = data;
        this.node = node;
        this.arraynodes2update = {};
        this.nodes2update = {};
        this.scanAppNode(this.node);
        if(data){
            this.updateAllNodes();
            this.updateAllArrayNodes();
        }
    }
    _initCss(){
        let style = document.createElement("style");
        style.type = 'text/css';
        style.innerHTML = '.d-none { display: none !important; }';
        document.getElementsByTagName('head')[0].appendChild(style);
    }
    scanAppNode(node){
        let append2nodes = (child, entries) => {
            for(let i = 0; i < entries.length; i ++){
                let entry = entries[i];
                let origin = child.cloneNode();
                if(!this.nodes2update[entry]){
                    this.nodes2update[entry] = [{node: child, origin:origin}];
                }
                else{
                    this.nodes2update[entry].push({node: child, origin:origin});
                }
            }
        };
        this.scanTree(node, (child) => {
            if (child.nodeName === "#text") {
                append2nodes(child, this._getEntries(child.data));
            }
            else if (child.nodeName !== "#text" && child.dataset && child.dataset.array) {
                child.classList.add("d-none");

                let arrName = child.dataset.array;
                if(!this.arraynodes2update[arrName]){
                    this.arraynodes2update[arrName] = [{origin: child, nodes: []}];
                }
                else{
                    this.arraynodes2update[arrName].push({origin: child, nodes: []});
                }
                return false;
            }
            else if(child.attributes && child.attributes.length > 0){
                for(let i = 0; i < child.attributes.length; i++){
                    append2nodes(child, this._getEntries(child.attributes[i].name));
                    append2nodes(child, this._getEntries(child.attributes[i].value));
                }
            }
            return true;
        });
    }

    scanTree(node, callback, origin){
        let stack = [node];
        let originStack = [origin];

        callback(node, origin);
        for(let i = 0; i < stack.length; i++){
            let item = stack[i];
            stack.splice(i, 1);
            let oriItem;
            if(origin){
                oriItem = originStack[i];
                originStack.splice(i, 1);
            }

            if(item.childNodes){
                for(let j = 0; j < item.childNodes.length; j++){
                    if(item.childNodes.length){
                        if(callback && !callback(item.childNodes[j], origin && oriItem ? oriItem.childNodes[j] : false)){
                            continue;
                        }
                        stack.push(item.childNodes[j]);
                        if(origin && oriItem){
                            originStack.push(oriItem.childNodes[j]);
                        }
                    }
                }
            }

            i--;
        }
    }

    updateAllNodes(){
        for(let entry in this.nodes2update){
            if(this.nodes2update.hasOwnProperty(entry)){
                this.updateNode(entry);
            }
        }
    }

    fillNodeData(node, data, origin, j, entry){
        if(origin && origin.nodeType === 3){
            let rawtext = origin.data;
            if(rawtext){
                let text = this._format(rawtext, data, this.data, j);
                if(/(<br|<b|<i|<a|<p)/.test(text)){
                    if(this.nodes2update[entry]){
                        if(node.nodeType === 3 && entry && this.nodes2update[entry]){
                            this.nodes2update[entry][j].node = node.parentNode;
                        }
                        if(this.nodes2update[entry][j].node.innerHTML !== text){
                            this.nodes2update[entry][j].node.innerHTML = text;
                        }
                    }
                    else{
                        if(node.parentNode.innerHTML !== text){
                            node.parentNode.innerHTML = text;
                        }
                    }
                }
                else{
                    if(node.data !== text){
                        node.textContent = text;
                    }
                }
            }
        }
        else if(origin && origin.nodeType === 1) {
            /*for (let i = 0; i < node.attributes.length; i++) {
                let attrName = node.attributes[i].name;
                let nodeAttr = origin.attributes.getNamedItem(attrName);
                if(!nodeAttr){
                    log(nodeAttr, attrName, origin, node)
                    node.removeAttribute(attrName);
                    if(["disabled", "checked"].includes(attrName)){
                        node[attrName] = false;
                    }
                }
            }*/
            for (let i = 0; i < origin.attributes.length; i++) {
                let originName = origin.attributes[i].name;
                let originValue = origin.attributes[i].value;
                let node_attr = node.attributes.getNamedItem(originName) || {};
                let currentName = node_attr.name;
                if (originName === "class") {
                    originValue = originValue.replace("d-none", "");
                }

                if(~originName.indexOf("{")){
                    let value2set = this._format(originValue, data, this.data, j);
                    let name2set = this._format(originName, data, this.data, j);
                    if(originName === '{disabled}' || originName === '{checked}' ){
                        node[name2set] = name2set === "disabled" || name2set === "checked" || name2set === "selected";
                    }
                    else if(!value2set){
                        node.removeAttribute(originName);
                    }
                    else if (currentName !== originName && originName) {
                        node.setAttribute(name2set, value2set);
                    }
                    else if (currentName && !name2set) {
                        node.removeAttribute(currentName);
                    }
                }
                else if(~originValue.indexOf("{")){
                    let value2set = this._format(originValue, data, this.data, j);
                    if(node_attr.value !== value2set){
                        if(originName === 'value') {
                            node.value = value2set;
                        }
                        else{
                            node.setAttribute(originName, value2set);
                        }
                        if(originName === "data-value"){
                            node.value = value2set;
                        }
                        if(originName === 'data-function'){
                            let func_str = node.dataset.function;
                            let [fName, fArgs] = func_str.split('(');
                            fArgs = fArgs.replace(')', "");

                            if (fArgs) {
                                let args = fArgs.split(",");
                                for (let i = 0; i < args.length; i++) {
                                    args[i] = args[i].trim();
                                }
                                let func = this._getVar(this.data, fName);
                                if (typeof func === 'function') {
                                    func.apply(node, args);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    updateNode(entry){
        let items = this.nodes2update[entry];

        if(items){
            for(let i = 0; i < items.length; i ++){
                this.fillNodeData(items[i].node, this.data, items[i].origin, i, entry);
            }
        }
        return items;
    }

    updateArrayNode(entry){
        let item = this.arraynodes2update[entry];
        let data = this._getVar(this.data, entry);
        if(data){
            if(typeof data === "function"){
                data = data.apply(this.data);
                if(!data){
                    return false;
                }
            }
            let update = (origin, node, data, j) =>{
                this.scanTree(node, (child, originChild)=>{
                    this.fillNodeData(child, data, originChild, j, entry);
                    return true;
                }, origin);
            };
            let insert = (nodes, origin, data, j) => {
                let node = origin.cloneNode(true);
                node.classList.remove("d-none");
                delete node.dataset.array;
                origin.parentNode.insertBefore(node, origin);
                update(origin, node, data, j);
                nodes.push(node);
            };
            if(item){
                for(let i = 0; i < item.length; i++){
                    let origin = item[i].origin;
                    let nodes = item[i].nodes;
                    for(let j = 0; j < Math.max(data.length, nodes.length); j++){

                        if(!nodes[j]){
                            insert(nodes, origin, data[j], j);

                        }
                        else if(data[j] && nodes[j]){
                            update(origin, nodes[j], data[j], j);
                            nodes[j].classList.remove("d-none");

                            delete nodes[j].dataset.array;

                        }
                        else if(!data[j] && nodes[j]){
                            nodes[j].remove();
                            nodes.splice(j, 1);
                            j --;
                        }
                    }
                }
            }
            else{
                log("can't find node: " + entry);
            }

        }
    }

    updateAllArrayNodes(){
        for(let entry in this.arraynodes2update){
            if(this.arraynodes2update.hasOwnProperty(entry)){
                this.updateArrayNode(entry);
            }
        }
    }

    _getVar(values, path) {
        let currpath = values;
        let varpath = path.trim().split(".");
        for(let i = 0; i < varpath.length; i ++){
            let curr = currpath[varpath[i]];
            if(curr !== undefined){
                currpath = curr;
            }
            else{
                return undefined;
            }
        }
        return currpath;
    }

    _keypath(values, n, m) {
        if (n.indexOf("[")) {
            n = n.replace(/\[([a-zA-Z0-9_,.= ]+)\]/g,  (m, n) => {
                return this._getVar(values, n);
            });
        }
        if (n.indexOf("(")) {
            let isfunc = false;
            let args = [];

            let func = n.replace(/\(([a-zA-Z0-9_,.\[\]= ]+)\)/g, (m, n) => {
                isfunc = true;
                args = n.split(",");
                return "";
            });
            if (isfunc) {
                if (~func.indexOf(".")) {
                    func = this._getVar(values, func);
                }
                else {
                    func = values[func];
                }
                if (typeof func === "function") {
                    return func(...args);
                }
                else {
                    return m;
                }


            }
        }

        let variable = this._getVar(values, n);

        if (variable === undefined) {
            return m;
        }
        else {
            return variable;
        }

    }

    _format(str, values, globalVals, j) {
        if(!values || !str)
            return str;
        str = str.replace("{i}", j);
        str = str.replace("[i]", "." + j);

        return str.replace(/\{([a-zA-Z0-9_.,=\[\])( ]+)\}/g,  (m, n) => {

            let path = this._keypath(values, n, m);

            if(path !== m){
                return path;
            }
            else{
                return this._keypath(globalVals, n, m);
            }
        });
    }

    _getEntries(text) {
        let entries = [];
        text.replace(/\{([a-zA-Z0-9_.,=\[\])( ]+)\}/g, function (m, n) {
            entries.push(n);
        });
        return entries;

    }
}


