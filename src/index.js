import React, {Component} from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import './styles/style.css';
import './styles/index.css';

import Popup from 'react-popup';
import './component/prompt';

import {checkStatus, exHandler} from './utils/fetch';

const Search = (props)=> {
    const {department, applyName}=props;
    return <div className="sch-condition clearfix">
        <div className="sch-item">
            <label>所属部门：</label>
            <input type="text" value={department} className="form-control" onChange={()=>{}}/>
        </div>
        <div className="sch-item">
            <label>申请人：</label>
            <input type="text" value={applyName} className="form-control" onChange={()=>{}}/>
        </div>
    </div>
}
class MenuItem extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: false
        }
    }

    handleTab(id, depth, idx) {
        if (this.props.renderMenuList) {
            // this.props.renderMenuList.call(this, {
            //     id: id,
            //     depth: depth + 1,
            //     idx: idx
            // })
            this.props.renderMenuList({
                    id: id,
                    depth: depth + 1,
                    idx: idx
            });
        }
    }


    handleModify(e, id, depth, idx) {
        e.stopPropagation();
        if (this.props.onModify) {
            this.props.onModify.call(this, {
                id: id,
                depth: depth,
                idx: idx,
            })
        }

    }

    handleSelect(e, depth, idx) {
        e.stopPropagation();
        if (this.props.onSelect) {
            this.props.onSelect.call(this, {
                depth: depth,
                idx: idx,
                checked: e.target.checked
            });
        }
    }


    render() {
        if (!this.props.list || !this.props.list.length) {
            return (
                <div className="loading">暂无数据</div>
            );
        }
        return (
            <div className="menu-items">
                {
                    this.props.list.map((val, index)=>
                        <div key={index} onClick={()=>this.handleTab(val.id,this.props.depth,index)}
                             className={val.selected ? "selected":""}>
                            <input type="checkbox" onClick={(e)=>this.handleSelect(e,this.props.depth,index)}/>
                            <span>{val.name}</span>
                            <i className="icon-edit" onClick={(e)=>this.handleModify(e,val.id,this.props.depth,index)}></i>
                        </div>
                    )
                }
            </div>
        );
    }
}
MenuItem.propTypes = {
    list: PropTypes.array
}
MenuItem.defaultProps = {
    list: []
}
class MenuBox extends Component {
    handleAddAjax(obj, id) {
        var self = this;
        var depth = self.props.depth;
        var name = obj.name.replace(/(^\s*)|(\s*$)|\r|\n/g, "");
        var szm = obj.szm && obj.szm.replace(/(^\s*)|(\s*$)|\r|\n/g, "");
        var page = obj.url.replace(/(^\s*)|(\s*$)|\r|\n/g, "");
        var isAdm = obj.checkAdm;
        var isUser = obj.checkUser;
        if (name === "") {
            window.alert("名称不能为空");
            return;
        }
        if (/['"<>]/g.test(name)) {
            window.alert("请输入合法的名称");
            return;
        }
        if ((!/^[0-9a-zA-Z]*$/g.test(szm) || szm === "") && depth === 1) {
            window.alert("系统三字码只能输入字母或数字");
            return;
        }
        if (page === "" && depth !== 2) {
            window.alert("URL不能为空");
            return;
        }
        if (/'"<>/g.test(page)) {
            window.alert("请输入合法的URL");
            return;
        }
        if (!isAdm && !isUser) {
            window.alert("至少选择一项谁可以看");
            return;
        }
        var roleStr = "2,3";
        if (isAdm && !isUser) {
            roleStr = "2";
        }
        if (!isAdm && isUser) {
            roleStr = "3";
        }
        var requestConfig = null;
        var url = "";
        if (id === undefined) {
            if (1 === depth) {
                requestConfig = {
                    "systemId": szm,
                    "systemName": name,
                    "remark": "",
                    "menuRole": roleStr,
                    "page": page,
                    "defaultPermission": 0
                };
                url = window.APIs.addSystem;
            } else {
                requestConfig = {
                    "name": name,
                    "fatherId": self.props.fatherId,
                    "depth": depth,
                    "pageUrl": page,
                    "menuRole": roleStr
                }
                url = window.APIs.addMenu;
            }
        } else {
            requestConfig = {
                "id": id,
                "name": name,
                "fatherId": self.props.fatherId,
                "page": obj.page,
                "pageUrl": depth === 1 ? "" : page,
                "menuRole": roleStr,
                "systemId": depth === 1 ? szm : null
            };
            url = window.APIs.modMenu;
        }
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(requestConfig)
        })
            .then(checkStatus)
            .then(function (res) {
                return res.json();
            }).then(function (json) {
            Popup.close();
            if (json.success) {
                Popup.alert(id === undefined ? '添加成功' : '修改成功');
                var item = {
                    id: id === undefined ? json.data.id : id,
                    systemId: szm,
                    name: name,
                    page: depth === 1 ? page : obj.page,
                    pageUrl: depth === 1 ? "" : page,
                    menuRole: roleStr,
                    defaultPermission: 0
                };
                id === undefined ? self.props.onAdd(item, depth) : self.props.onModify(item, depth);
            } else {
                Popup.alert(json.msg);
            }


        })
    }

    handleAdd(depth, title) {
        var self = this;
        title = depth === 1 ? '添加系统' : title + "-添加菜单";
        var item = null
        /** Call the plugin */
        Popup.plugins().prompt(item, depth, title, function (obj) {
            self.handleAddAjax(obj);
        });
    }

    handleDelAjax(depth) {
        var ids = this.props.list.filter((val)=>val.checked).map((val)=>val.id);
        var self = this;
        fetch(window.APIs.delMenu, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                id: ids.join(",")
            })
        })
            .then(checkStatus)
            .then(function (res) {
                return res.json();
            }).then(function (json) {
            if (json.success) {
                Popup.alert('删除菜单成功');
                self.props.onDel(ids, depth);
            } else {
                Popup.alert(json.msg);
            }

        })

    }

    handleDel(depth) {
        var self = this;
        Popup.create({
            title: '提示',
            content: '菜单删除后将不可恢复，确认删除？',
            className: 'alert',
            buttons: {
                left: [{
                    text: '取消',
                    className: 'default',
                    action: function () {
                        Popup.close();
                    }
                }],
                right: [{
                    text: '确定',
                    className: 'success',
                    action: function () {
                        self.handleDelAjax(depth);
                        Popup.close();
                    }
                }]
            }
        }, true);
    }

    onModify({id, depth, idx}) {
        var self = this;
        var item = this.props.list.filter((val, index)=>idx === index)[0];
        var title = depth === 1 ? "修改系统" : this.props.barTitle + "-修改菜单";
        Popup.plugins().prompt(item, depth, title, function (obj) {
            obj["page"] = item.page;
            self.handleAddAjax(obj, id);
        });
    }

    render() {
        return (
            <div className="menu-box">
                <div className="menu-block">
                    <div className="menu-header">
                        <h4>{this.props.barTitle}</h4>
                        <div className="menu-option">
                            <i className={this.props.hidden?"icon-add hidden" : "icon-add"}
                               onClick={()=>this.handleAdd(this.props.depth,this.props.barTitle)}></i>
                            &nbsp;&nbsp;
                            <i className={this.props.hidden?"icon-subtraction hidden" : "icon-subtraction"}
                               onClick={()=>this.handleDel(this.props.depth)}></i>
                        </div>
                    </div>
                    <MenuItem list={this.props.list} depth={this.props.depth} renderMenuList={this.props.renderMenuList}
                              onSelect={this.props.onSelect} onModify={this.onModify.bind(this)}/>
                </div>
            </div>
        )
    }
}
class MenuConfig extends Component {
    constructor(props) {
        super(props);
        this.state = {
            systemList: [],
            subMenuList: [],
            threeMenuList: [],
            subMenuTitle: "二级菜单",
            threeMenuTitle: "三级菜单",
            subFatherId: 0,
            threeFatherId: 0,
            subHidden: true,
            threeHidden: true
        };
    }

    onAdd(item, depth) {
        switch (depth) {
            case 1:
                this.state.systemList.push(item);
                this.setState(this.state.systemList);
                break;
            case 2:
                this.state.subMenuList.push(item);
                this.setState(this.state.subMenuList);
                break;
            default:
                this.state.threeMenuList.push(item);
                this.setState(this.state.threeMenuList);
        }
    }

    onDel(ids, depth) {
        switch (depth) {
            case 1:
                this.setState({
                    systemList: this.state.systemList.filter((val)=>ids.indexOf(val.id) === -1)
                });
                break;
            case 2:
                this.setState({
                    subMenuList: this.state.subMenuList.filter((val)=>ids.indexOf(val.id) === -1)
                });
                break;
            default:
                this.setState({
                    threeMenuList: this.state.threeMenuList.filter((val)=>ids.indexOf(val.id) === -1)
                });
                break;
        }
    }

    onSelect({depth, idx, checked}) {
        switch (depth) {
            case 1:
                this.setState({
                    systemList: this.state.systemList.map((val, index)=> {
                        if (idx === index) {
                            return Object.assign({}, val, {checked});
                        } else {
                            return val;
                        }
                    })
                });
                break;
            case 2:
                this.setState({
                    subMenuList: this.state.subMenuList.map((val, index)=> {
                        if (idx === index) {
                            return Object.assign({}, val, {checked});
                        } else {
                            return val;
                        }
                    })
                });
                break;
            default:
                this.setState({
                    threeMenuList: this.state.threeMenuList.map((val, index)=> {
                        if (idx === index) {
                            return Object.assign({}, val, {checked});
                        } else {
                            return val;
                        }
                    })
                });
        }
    }

    onModify(item, depth) {
        switch (depth) {
            case 1:
                this.setState({
                    systemList: this.state.systemList.map((val)=> {
                        if (item.id === val.id) {
                            return Object.assign({}, val, item);
                        } else {
                            return val;
                        }
                    })
                });
                break;
            case 2:
                this.setState({
                    subMenuList: this.state.subMenuList.map((val)=> {
                        if (item.id === val.id) {
                            console.log(Object.assign({}, val, item));
                            return Object.assign({}, val, item);
                        } else {
                            return val;
                        }
                    })
                });
                break;
            default:
                this.setState({
                    threeMenuList: this.state.threeMenuList.map((val)=> {
                        if (item.id === val.id) {
                            return Object.assign({}, val, item);
                        } else {
                            return val;
                        }
                    })
                });
                break;

        }
    }


    onToggle(depth, idx) {
        switch (depth) {
            case 2:
                this.state.systemList && this.state.systemList.forEach((val, index)=> {
                    val.selected = index === idx ? "selected" : "";
                });
                this.setState({
                    subMenuList: [],
                    threeMenuList: [],
                    threeMenuTitle: '三级菜单',
                    subMenuTitle: this.state.systemList[idx].name,
                    subHidden: false,
                    threeHidden: true,
                    subFatherId: this.state.systemList.filter((val)=>val.selected === "selected")[0].id,
                });
                break;
            case 3:
                this.state.subMenuList && this.state.subMenuList.forEach((val, index)=> {
                    val.selected = index === idx ? "selected" : "";
                });
                this.setState({
                    threeMenuList: [],
                    threeMenuTitle: this.state.subMenuList[idx].name,
                    subHidden: false,
                    threeHidden: false,
                    threeFatherId: this.state.subMenuList.filter((val)=>val.selected === "selected")[0].id
                });
                break;
            default:break;
        }
    }

    renderList({id, depth, idx}) {
        let self = this;
        if (depth === undefined) {
            return;
        }
        self.onToggle(depth, idx);
        let url = depth === 1 ? window.APIs.getSystemList : window.APIs.getSubMenuList;
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                id: id
            })
        })
            .then(checkStatus)
            .then(function (res) {
                return res.json();
            }).then(function (json) {
                if (!json.success) {
                    throw new Error(json.msg || '请求失败')
                }
                if (Object.prototype.toString.call(json.data) !== '[object Array]') {
                    return;
                }
                var data = json.data.map((val, index)=> {
                    val["selected"] = "";
                    val["checked"] = false;
                    return val;
                });
                switch (depth) {
                    case 2:
                        self.setState({
                            subMenuList: data
                        });
                        break;
                    case 3:
                        self.setState({
                            threeMenuList: data
                        });
                        break;
                    default:
                        self.setState({
                            systemList: data
                        });
                }

            })
            .catch(exHandler);
    }

    componentDidMount() {
        this.renderList({id: "", depth: 1});
    }

    render() {
        return (
            <div className="menu-container">
                <MenuBox list={this.state.systemList} barTitle="系统名称" depth={1}
                         renderMenuList={this.renderList.bind(this)} onAdd={this.onAdd.bind(this)}
                         onSelect={this.onSelect.bind(this)} onDel={this.onDel.bind(this)}
                         onModify={this.onModify.bind(this)}/>
                <MenuBox list={this.state.subMenuList} barTitle={this.state.subMenuTitle} depth={2}
                         renderMenuList={this.renderList.bind(this)} hidden={this.state.subHidden}
                         fatherId={this.state.subFatherId} onAdd={this.onAdd.bind(this)}
                         onSelect={this.onSelect.bind(this)} onDel={this.onDel.bind(this)}
                         onModify={this.onModify.bind(this)}/>
                <MenuBox list={this.state.threeMenuList} barTitle={this.state.threeMenuTitle} depth={3}
                         renderMenuList={this.renderList.bind(this)} hidden={this.state.threeHidden}
                         fatherId={this.state.threeFatherId} onAdd={this.onAdd.bind(this)}
                         onSelect={this.onSelect.bind(this)} onDel={this.onDel.bind(this)}
                         onModify={this.onModify.bind(this)}/>
            </div>
        )

    }
}

class AllUI extends Component {
    render() {
        return (
            <div className="menu-wrapper">
                <Search
                    department={ '风控研发' }
                    applyName={ '冯深海' }
                />
                <MenuConfig />
                <Popup />
            </div>
        )
    }
}

ReactDOM.render(<AllUI/>, document.getElementById('root'));
