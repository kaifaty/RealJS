# Real JS
##### Micro framework for comfortable working with javascript

##### [performance](https://kaifaty.github.io/RealJS/example/performance.html)

- No Virtual DOM
- Vanila JS
- 2.1kb gzipped
- No reference



The goal of modern JS frameworks is to simplify the life of frontend developers as much as possible. The problem is that everyone is trying to drag you as much as possible into the abyss of dependencies and plug-ins, which ultimately affects the performance of the application. In addition, it takes a huge amount of time to completely amaze the framework, but this does not guarantee that you will not encounter any problem that VanilaJS could easily solve, but don’t know how to solve using the framework.

RealJS updates only the data that you specify to update. only 4 methods are provided - updateNode, updateAllNodes, updateArrayNode, updateAllArrayNodes.

### Getting started
1. Simple text
     ```
       <div id="app">
            {message}
        </div>
        
        let real = new Real(window['app'], {
            message: "RealJS - javascript micro framework"
        });
    ```
   
2. Update node

    ```
    <div id="app">
        {message}
    </div>
    
    let real = new Real(window['app'], {
        message: new Date().toLocaleTimeString();
    });
    setInterval(()=>{
            data.message = new Date().toLocaleTimeString();
            real.updateNode('message');
    }, 1000);
    
    
    ```
   
3. Array node
    ```
    <div id="app">
        <ul>
               <li data-array="message">{text}</li>
        </ul>
    </div>
    
    let real = new Real(window['app'], {
        message: [
                {text: "No Virtual DOM using"},
                {text: "Can change attributes"},
                {text: "Multilang”},
        ]
    });
    ```

4. Update array node
    ```
    <div id="app">
        <ul>
               <li data-array="message">{text}</li>
        </ul>
    </div>
    
    let real = new Real(window['app'], {
        message: [
                {text: "No Virtual DOM using"},
                {text: "Can change attributes"},
                {text: "Multilang”},
        ]
    });
    setInterval(()=>{
            data.message[2] = new Date().toLocaleTimeString();
            real.updateArrayNode('message');
    }, 1000);
    

    ```
5. Function
    ```
    <div id="app">
       {multy(5,5)}
    </div>
    
    let real = new Real(window['app'], {
        multy(a, b){
                return a * b;
        }
    });

    ```
6. Attributes
    ```
        <div id="app">
            <img src = “{src}”>
        </div>
        
        let real = new Real(window['app'], {
            src: “/media/logo.png”
        });

    ```
