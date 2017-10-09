/**
 * Created by fengshenhai on 2017/9/5.
 */
import React from 'react';
import Popup from 'react-popup';
import '../styles/prompt.css'



/** The prompt content component */
export default class Prompt extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            name:this.props.item===null? "":this.props.item.name,
            szm:this.props.item===null? "":this.props.item.systemId,
            url:this.props.item===null? "":(this.props.depth===1 ? this.props.item.page:this.props.item.pageUrl),
            checkAll:this.props.item===null? true : (this.props.item.menuRole+"").split(",").length===2,
            checkAdm:this.props.item===null? true : (this.props.item.menuRole+"").split(",").indexOf("2")!==-1,
            checkUser:this.props.item===null? true : (this.props.item.menuRole+"").split(",").indexOf("3")!==-1
        };

        this.onChange = (e) => this._onChange(e);
    }

    componentDidUpdate(prevProps, prevState) {
       // if (prevState.value !== this.state.value) {
            this.props.onChange(this.state);
       // }
    }

    _onChange(e) {
        let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        let name= e.target.name;
        this.setState({[name]: value});
        if(name==='checkAll'){
            this.setState({
                checkAdm:value,
                checkUser:value
            })
        }
        if(name==='checkAdm' || name==='checkUser'){
            setTimeout(()=>{
                this.setState({checkAll:(this.state.checkAdm&&this.state.checkUser)});
            },0);
        }
    }

    render() {
        return (
                <div>
                    <table className="table">
                        <tbody>
                            <tr><td className="right"><span className="red">*</span> 名称:</td><td><input type="text" placeholder="请输入系统名称" className="form-control-new" name="name" value={this.state.name}  onChange={this.onChange}/></td></tr>
                            <tr className={this.props.depth===1?"":"hidden"}><td className="right"><span className="red">*</span> 三字码:</td><td><input type="text"  className="form-control-new" name="szm" value={this.state.szm}  onChange={this.onChange}/></td></tr>
                            <tr><td className="right"><span className={this.props.depth===2?"hidden":"red"}>*</span> URL:</td><td><input type="text"  className="form-control-new" name="url" value={this.state.url}  onChange={this.onChange}/></td></tr>
                            <tr><td className="right"><span className="red">*</span> 角色:</td><td><label><strong>全部</strong><input type="checkbox" name="checkAll" checked={this.state.checkAll} onChange={this.onChange}></input></label><label>管理员<input type="checkbox" name="checkAdm" checked={this.state.checkAdm} onChange={this.onChange}></input></label><label>普通用户<input type="checkbox" name="checkUser" checked={this.state.checkUser} onChange={this.onChange}></input></label></td></tr>
                        </tbody>
                    </table>
                </div>
            );
    }
}
/** Prompt plugin */
Popup.registerPlugin('prompt', function (item, depth,title,callback) {
    let promptObj = null;
    let promptChange = function (obj) {
        promptObj  = obj;
    };
    this.create({
        title: title,
        content: <Prompt onChange={promptChange} item={item} depth={depth}/>,
        buttons: {
            left: ['cancel'],
            right: [{
                text: '确定',
                className: 'success',
                action: function () {
                    if(!promptObj){
                        alert("请输入或修改内容");
                        return;
                    }
                    callback(promptObj);
                    //Popup.close();
                }
            }]
        }
    });
});
