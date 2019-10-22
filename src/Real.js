
class Real{
    constructor(node, data){
        this._initCss();
        this.data = data;
        this.node = node;
        this.arraynodes2update = {};
        this.nodes2update = {};
        this.scanAppNode(this.node);
        this.updateAllNodes();
        this.updateAllArrayNodes();
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
                append2nodes(child, getEntries(child.data));
            }
            else if (child.nodeName !== "#text" && child.dataset.array) {
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
            else if(child.attributes.length > 0){
                for(let i = 0; i < child.attributes.length; i++){
                    append2nodes(child, getEntries(child.attributes[i].name));
                    append2nodes(child, getEntries(child.attributes[i].value));
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

            for(let j = 0; j < item.childNodes.length; j++){
                if(item.childNodes.length){
                    if(callback && !callback(item.childNodes[j], origin ? oriItem.childNodes[j] : false)){
                        continue;
                    }
                    stack.push(item.childNodes[j]);
                    if(origin){
                        originStack.push(oriItem.childNodes[j]);
                    }
                }
            }
            i--;
        }
    }

    fillNodeData(node, data, origin, j, entry){
        if(origin && origin.nodeType === 3){
            let rawtext = origin.data;
            if(rawtext){
                let text = format(rawtext, data, this.data, j);
                if(/(<br>|<b>|<i>)/.test(text)){
                    if(this.nodes2update[entry]){
                        if(node.nodeType === 3 && entry && this.nodes2update[entry]){
                            this.nodes2update[entry][j].node = node.parentNode;
                        }
                        this.nodes2update[entry][j].node.innerHTML = text;
                    }
                    else{
                        node.parentNode.innerHTML = text;
                    }

                }
                else{
                    node.textContent = text;
                }
            }
        }
        else if(origin && origin.nodeType !== 3) {
            for (let i = 0; i < node.attributes.length; i++) {
                let nodeName = node.attributes[i].name;
                let node_attr = origin.attributes.getNamedItem(nodeName);
                if(!node_attr){
                    node.removeAttribute(nodeName);
                    if(["disabled", "checked"].includes(nodeName)){
                        node[nodeName] = false;
                    }
                }
            }
            for (let i = 0; i < origin.attributes.length; i++) {
                let originName = origin.attributes[i].name;
                let originValue = origin.attributes[i].value;
                let node_attr = node.attributes.getNamedItem(originName) || {};
                let currentName = node_attr.name;
                let currentValue = node_attr.value;
                let value2set = originValue;

                if (originName === "class") {
                    value2set = value2set.replace("d-none", "");
                }

                value2set = format(value2set, data, this.data, j);
                let name2set = format(originName, data, this.data, j);

                if (currentName !== name2set && name2set) {
                    node.setAttribute(name2set, value2set);
                    if(["disabled", "checked"].includes(name2set)){
                        node[name2set] = true;
                    }
                }
                else if (currentName && !name2set) {
                    node.removeAttribute(currentName);
                }
                else if (currentName && name2set && currentName !== name2set) {
                    node.setAttribute(name2set, value2set);
                }
                else if (currentValue !== value2set) {
                    node_attr.value = value2set;
                }
            }
            if (node.dataset.function) {
                let func_str = node.dataset.function;
                let args = func_str.match(/\(([a-zA-Z0-9_. ,]+)\)/);
                if (args) {
                    args = args[1].split(",");
                    for (let i = 0; i < args.length; i++) {
                        args[i] = args[i].trim();
                        if (args[i] === "context") {
                            args[i] = node;
                        }
                    }
                    let func = func_str.replace(/\(([a-zA-Z0-9_. ,]+)\)/, "");
                    if (D[func]) {
                        D[func](...args);
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

    updateAllNodes(){
        for(let entry in this.nodes2update){
            if(this.nodes2update.hasOwnProperty(entry)){
                this.updateNode(entry);
            }
        }
    }

    updateArrayNode(entry){
        let item = this.arraynodes2update[entry];
        let data = getVar(this.data, entry);
        if(data){
            if(typeof data === "function"){
                data = data.apply(this.data);
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
}

function getVar(values, path) {
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

function keypath(values, n, m) {
    if (n.indexOf("[")) {
        n = n.replace(/\[([a-zA-Z0-9_,.= ]+)\]/g, function (m, n) {
            return getVar(values, n);
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
                func = getVar(values, func);
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

    let variable = getVar(values, n);

    if (variable === undefined) {
        return m;
    }
    else {
        return variable;
    }

}

function format(str, values, globalVals, j) {
    if(!values || !str)
        return str;
    str = str.replace("{i}", j);
    str = str.replace("[i]", "." + j);

    return str.replace(/\{([a-zA-Z0-9_.,=\[\])( ]+)\}/g, function (m, n) {

        let path = keypath(values, n, m);

        if(path !== m){
            return path;
        }
        else{
            let path = keypath(globalVals, n, m);
            return path;
        }
    });
}

function getEntries(text) {
    let entries = [];
    text.replace(/\{([a-zA-Z0-9_.,=\[\])( ]+)\}/g, function (m, n) {
        entries.push(n);
    });
    return entries;

}
