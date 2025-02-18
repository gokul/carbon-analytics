/*
 *  Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */
/**
 * class which manages worker specific details.
 */
import React from "react";
import {Link} from "react-router-dom";
//App Components
import StatusDashboardAPIS from "../utils/apis/StatusDashboardAPIs";
import ChartCard from "../common/ChartCard";
import DashboardUtils from "../utils/DashboardUtils";
import Header from "../common/Header";
//Material UI
import RaisedButton from "material-ui/RaisedButton";
import {Toolbar, ToolbarGroup} from "material-ui/Toolbar";
import HomeButton from "material-ui/svg-icons/action/home";
import {Card, CardHeader, CardMedia, Divider, FlatButton} from "material-ui";
import { Redirect } from 'react-router-dom';
import AuthenticationAPI from "../utils/apis/AuthenticationAPI";
import Error403 from "../error-pages/Error403";
import AuthManager from "../auth/utils/AuthManager";
const styles = {button: {margin: 12, backgroundColor: '#f17b31',fontSize:10}};
const cpuMetadata = {names: ['Timestamp', 'System CPU', 'Process CPU'], types: ['time', 'linear', 'linear']};
const memoryMetadata = {names: ['Timestamp', 'Used Memory', 'Init Memory', 'Committed Memory', 'Total Memory'],
    types: ['time', 'linear', 'linear', 'linear', 'linear']};
const loadAvgMetadata = {names: ['Timestamp', 'Load Average'], types: ['time', 'linear']};
const throughputMetadata = {names: ['Timestamp', 'Throughput(events/second)'], types: ['time', 'linear']};



/**
 * class which manages worker history details.
 */
export default class WorkerHistory extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            workerID: this.props.match.params.id.split("_")[0] + ":" + this.props.match.params.id.split("_")[1],
            systemCpu: [],
            processCpu: [],
            usedMem: [],
            initMem: [],
            committedMem: [],
            totalMem: [],
            loadAvg: [],
            throughputAll: [],
            period: '5min',
            isApiWaiting: true,
            tickCount: 10,
            sessionInvalid: false,
            hasViewerPermission: true,

        };
        this.handleChange = this.handleChange.bind(this);
        this.handleApi = this.handleApi.bind(this);
    }


    handleChange(value) {
        this.setState({
            period: value,
            systemCpu: [],
            processCpu: [],
            throughputAll: [],
            usedMem: [],
            initMem: [],
            committedMem: [],
            totalMem: [],
            loadAvg: [],
            isApiWaiting: true,
            tickCount: 10
        });
        this.handleApi(value);
    }

    handleApi(value) {
        let queryParams = {
            params: {
                period: value
            }
        };
        let that = this;
        StatusDashboardAPIS.getWorkerHistoryByID(this.props.match.params.id, queryParams)
            .then(function (response) {
                that.setState({
                    systemCpu: response.data.systemCPU.data,
                    processCpu: response.data.processCPU.data,
                    usedMem: response.data.usedMemory.data,
                    initMem: response.data.initMemory.data,
                    committedMem: response.data.committedMemory.data,
                    totalMem: response.data.totalMemory.data,
                    loadAvg: response.data.loadAverage.data,
                    throughputAll: response.data.throughput.data,
                    isApiWaiting: false,
                    //assume all have same polling interval
                    tickCount:response.data.systemCPU.data.length>10 ? 10 : response.data.systemCPU.data.length
                });
            }).catch((error) => {
            let message;
            if(error.response != null) {
                if (error.response.status === 401) {
                    message = "Authentication fail. Please login again.";
                    this.setState({
                        sessionInvalid: true
                    })
                } else if (error.response.status === 403) {
                    message = "User Have No Viewer Permission to view this page.";
                    this.setState({
                        hasViewerPermission: false
                    })
                } else {
                    message = "Unknown error occurred! : " + error.response.data;
                }
            }
        });
    }

    componentWillMount() {
        AuthenticationAPI.isUserAuthorized('viewer', AuthManager.getUser().SDID)
            .then((response) => {
                that.setState({
                    hasViewerPermission: response.data
                });
            }).catch((error) => {
            let message;
            if(error.response != null) {
                if (error.response.status === 401) {
                    message = "Authentication fail. Please login again.";
                    this.setState({
                        sessionInvalid: true
                    })
                } else if (error.response.status === 403) {
                    message = "User Have No Viewer Permission to view this page.";
                    this.setState({
                        hasViewerPermission: false
                    })
                } else {
                    message = "Unknown error occurred! : " + error.response.data;
                }
            }
        });
        this.handleApi(this.state.period);
    }

    setColor(period) {
        return (this.state.period === period) ? '#f17b31' : '';
    }

    renderCpuChart() {
        const cpuLineChartConfig = {
            x: 'Timestamp',
            charts: [{type: 'area', y: 'System CPU', fill: '#f17b31', style: {markRadius: 2}},
                {type: 'area', y: 'Process CPU', style: {markRadius: 2}}],
            width: 800,
            height: 250,
            legend:true,
            interactiveLegend: true,
            gridColor: 'white',
            xAxisTickCount:this.state.tickCount,
            tipTimeFormat:"%Y-%m-%d %H:%M:%S %Z",
            style: {
                tickLabelColor:'white',
                legendTextColor: '#9c9898',
                legendTitleColor: '#9c9898',
                axisLabelColor: '#9c9898',
                legendTextSize:12,
                legendTitleSize:12
            }
        };
        if (this.state.systemCpu.length === 0 && this.state.processCpu.length === 0) {
            return (
                <Card><CardHeader title="CPU Usage"/><Divider/>
                    <CardMedia>
                        <div style={{backgroundColor: '#131313'}}>
                            <h4 style={{marginTop: 0}}>No Data Available</h4>
                        </div>
                    </CardMedia>
                </Card>
            );
        }
        let intY= DashboardUtils.initCombinedYDomain(this.state.systemCpu, this.state.processCpu);
        return (
            <ChartCard
                data={DashboardUtils.getCombinedChartList(this.state.systemCpu, this.state.processCpu)} yDomain={intY}
                metadata={cpuMetadata} config={cpuLineChartConfig} title="CPU Usage"/>
        );
    }

    renderMemoryChart() {
        const memoryLineChartConfig = {
            x: 'Timestamp',
            charts: [{type: 'area', y: 'Used Memory',fill: '#058DC7',style: {markRadius: 2}},
                {type: 'area', y: 'Init Memory', fill: '#50B432', style: { markRadius: 2}},
                {type: 'area', y: 'Committed Memory', fill: '#f17b31', style: { markRadius: 2}},
                {type: 'area', y: 'Total Memory', fill: '#8c51a5', style: {markRadius: 2}}],
            width: 800,
            height: 250,
            legend:true,interactiveLegend: true,
            gridColor: 'white',
            xAxisTickCount:this.state.tickCount,
            tipTimeFormat:"%Y-%m-%d %H:%M:%S %Z",
            style: {
                tickLabelColor:'white',
                legendTextColor: '#9c9898',
                legendTitleColor: '#9c9898',
                axisLabelColor: '#9c9898',
                legendTextSize:12,
                legendTitleSize:12
            }
        };
        if (this.state.usedMem.length === 0 && this.state.totalMem.length === 0 && this.state.initMem.length === 0
            && this.state.committedMem.length === 0) {
            return (
                <Card><CardHeader title="Memory Usage"/><Divider/>
                    <CardMedia>
                        <div style={{backgroundColor: '#131313'}}>
                            <h4 style={{marginTop: 0}}>No Data Available</h4>
                        </div>
                    </CardMedia>
                </Card>
            );
        }
        let data1 = DashboardUtils.getCombinedChartList(this.state.usedMem, this.state.initMem);
        let intY= DashboardUtils.initCombinedYDomain(this.state.usedMem, this.state.initMem);
        let data2 = DashboardUtils.getCombinedChartList(data1, this.state.committedMem);
        let y2=DashboardUtils.getCombinedYDomain(this.state.committedMem,intY);
        let data = DashboardUtils.getCombinedChartList(data2, this.state.totalMem);
        let y3=DashboardUtils.getCombinedYDomain(this.state.totalMem,y2);
        return (
            <ChartCard data={data} yDomain={y3}
                       metadata={memoryMetadata} config={memoryLineChartConfig} title="Memory Usage"/>
        );
    }

    renderLoadAverageChart() {
        const loadAvgLineChartConfig = {
            x: 'Timestamp', charts: [{type: 'area', y: 'Load Average',  style: {markRadius: 2}}], width: 800, height: 250,
            legend:true,
            interactiveLegend: true,
            gridColor: 'white',
            xAxisTickCount:this.state.tickCount,
            tipTimeFormat:"%Y-%m-%d %H:%M:%S %Z",
            style: {
                tickLabelColor:'white',
                legendTextColor: '#9c9898',
                legendTitleColor: '#9c9898',
                axisLabelColor: '#9c9898',
                legendTextSize:12,
                legendTitleSize:12
            }
        };
        if (this.state.loadAvg.length === 0) {
            return (
                <Card><CardHeader title="Load Average"/><Divider/>
                    <CardMedia>
                        <div style={{backgroundColor: '#131313'}}>
                            <h4 style={{marginTop: 0}}>No Data Available</h4>
                        </div>
                    </CardMedia>
                </Card>
            );
        }
        return (
            <ChartCard data={this.state.loadAvg} metadata={loadAvgMetadata} config={loadAvgLineChartConfig}
                       title="Load Average"/>
        );
    }

    renderThroughputChart() {
        const throughputChartConfig = {
                x: 'Timestamp', charts: [{type: 'area', y: 'Throughput(events/second)',  style: {markRadius: 2}}], width: 800, height: 250,
                legend:true,interactiveLegend: true,
                gridColor: 'white',
                xAxisTickCount:this.state.tickCount,
                tipTimeFormat:"%Y-%m-%d %H:%M:%S %Z",
                style: {
                    tickLabelColor:'white',
                    legendTextColor: '#9c9898',
                    legendTitleColor: '#9c9898',
                    axisLabelColor: '#9c9898',
                    legendTextSize:12,
                    legendTitleSize:12
                }
        };
        if (this.state.throughputAll.length === 0) {
            return (
                <Card><CardHeader title="Throughput"/><Divider/>
                    <CardMedia>
                        <div style={{backgroundColor: '#131313'}}>
                            <h4 style={{marginTop: 0}}>No Data Available</h4>
                        </div>
                    </CardMedia>
                </Card>
            );
        }
        return (
            <ChartCard data={this.state.throughputAll} metadata={throughputMetadata} config={throughputChartConfig}
                       title="Throughput"/>
        );
    }

    renderCharts() {
        if (this.state.isApiWaiting) {
            return (
                <div style={{backgroundColor: '#222222', width: '100%', height: '100%'}} data-toggle="loading"
                     data-loading-inverse="true">
                    <div id="wrapper" style={{
                        backgroundColor: '#222222',
                        textAlign: 'center',
                        paddingTop: '200px',
                        paddingBottom: '200px'
                    }}>
                        <i className="fw fw-loader5 fw-spin fw-inverse fw-5x"></i>
                    </div>
                </div>
            );
        } else {
            return (
                <div style={{width: '90%', marginLeft: '10px'}}>
                    <div style={{padding: 30}}>
                        {this.renderCpuChart()}
                    </div>

                    <div style={{padding: 30}}>
                        {this.renderMemoryChart()}
                    </div>

                    <div style={{padding: 30}}>
                        {this.renderLoadAverageChart()}
                    </div>

                    <div style={{padding: 30}}>
                        {this.renderThroughputChart()}
                    </div>

                    <div style={{marginLeft: '89%'}}>
                        <Link to={window.contextPath + '/worker/history/' + this.props.match.params.id + '/more'}>
                            <RaisedButton label="More Details" style={styles.button}
                                          backgroundColor='#f17b31'/>
                        </Link>
                    </div>
                </div>
            );
        }
    }

    render() {
        if (this.state.sessionInvalid) {
            return (
                <Redirect to={{pathname: `${window.contextPath}/logout`}}/>
            );
        }
        if(this.state.hasViewerPermission) {
            return (
                <div style={{backgroundColor: '#222222'}}>
                    <Header/>
                    <div className="navigation-bar">
                        <Link to={window.contextPath}><FlatButton label="Overview >"
                                                                  icon={<HomeButton color="black"/>}/>
                        </Link>
                        <Link to={window.contextPath + '/worker/' + this.props.match.params.id }>
                            <FlatButton label={this.state.workerID + " >"}/></Link>
                        <RaisedButton label="Metrics" disabled disabledLabelColor='white'
                                      disabledBackgroundColor='#f17b31'/>
                    </div>
                    <div className="worker-h1">
                        <h2 style={{marginLeft: 40}}> {this.state.workerID} Metrics </h2>
                    </div>
                    <Toolbar style={{width: '50%', marginLeft: '50%', padding: 20, backgroundColor: '#424242'}}>
                        <ToolbarGroup firstChild={true}>
                            <RaisedButton label="Last 5 Minutes" backgroundColor={this.setColor('5min')}
                                          onClick={() => this.handleChange('5min')}
                                          style={styles.button}/>
                            <RaisedButton label="Last 1 Hour" backgroundColor={this.setColor('1hr')}
                                          onClick={() => this.handleChange('1hr')}
                                          style={styles.button}/>
                            <RaisedButton label="Last 6 Hours" backgroundColor={this.setColor('6hr')}
                                          onClick={() => this.handleChange('6hr')}
                                          style={styles.button}/>
                            <RaisedButton label="Last Day" backgroundColor={this.setColor('24hr')}
                                          onClick={() => this.handleChange('24hr')} style={styles.button}/>
                            <RaisedButton label="Last Week" backgroundColor={this.setColor('1wk')}
                                          onClick={() => this.handleChange('1wk')} style={styles.button}/>
                        </ToolbarGroup>
                    </Toolbar>
                    {this.renderCharts()}
                </div>
            );
        } else {
            return <Error403/>;
        }
    }
}
