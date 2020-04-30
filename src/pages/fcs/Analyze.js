import React, {useEffect, useState} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, ExpansionPanelActions} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {Grid, Divider, Typography, TextField, Button, CircularProgress} from "@material-ui/core";

import CustomSelect from './shared/CustomSelect';
import Scatter from './shared/ScatterPlot';
import Heatmap from './shared/Heatmap';
import LineChart from './shared/LineChart';
import {toast} from "react-toastify";

const useStyles = makeStyles(theme => ({
    heading: {
        fontSize: theme.typography.pxToRem(18),
    },
    icon: {
        verticalAlign: 'bottom',
        height: 20,
        width: 20,
    },
    details: {
        alignItems: 'center',
    },
    column: {
        flexBasis: '33.33%',
    }

}));


export default function Analyze() {
    const classes = useStyles();
    var urlpath = process.env.NODE_ENV === "development" ? process.env.REACT_APP_URL_PATH : process.env.REACT_APP_API_PATH;        

    const [expanded, setExpanded] = useState(false);//React.useState(false);
    const [xval, setXval] = useState("");
    const [yval, setYval] = useState("");
    const [transformation, setTransformation] = useState("");
    const [graphTitle, setGraphTitle] = useState("Choose Columns & Transformation Function");
    const [selectedFcs, setSelectedFcs] = useState(0);
    const [allFcs, setAllFcs] = useState([]);
    const [allColumns, setAllColumns] = useState([]);
    var [dateFrom, setDateFrom] = useState("");//new Date().toISOString().substring(0,16));//"2019-03-06T10:30"
    var [dateTo, setDateTo] = useState("");//new Date().toISOString().substring(0,10));//"2019-03-06T10:30"
    const [fcsType, setFcsType] = useState("");
    const [location, setLocation] = useState("");
    const [allLocations, setAllLocations] = useState([]);
    

    const [dataToPlot, setDataToPlot] = useState([]);
    const [lineData, setLineData] = useState([]);
    const [lineDataKeys, setLineDataKeys] = useState([]);
    const [gatedData, setGatedData] = useState([]);
    
    const [title, setTitle] = useState("here");
    const [fcsSectionTitle, setFcsSectionTitle] = useState("Select FCS file");

    const [gateX1, setGateX1] = useState(5);
    const [gateY1, setGateY1] = useState(5);
    const [gateX2, setGateX2] = useState(12);
    const [gateY2, setGateY2] = useState(12);
    const [binwidth, setBinwidth] = useState(1000);
    
    const [loading, setLoading] = React.useState(false);
    const [clusterImage, setClusterImage] = useState("");
    const [clusters, setClusters] = useState(2);

    async function loadFcsSelect(){
        setLoading(true);
        await fetch(`${urlpath}/loadFcsFiles/?dateFrom=${dateFrom}&dateTo=${dateTo}&category=${fcsType}&location=${location}`)
        .then(response => response.json())
        .then(function(response){
            if (response["status"]){
                setAllFcs(response["payload"]);
                setTitle("success");
                toast.info(response["payload"].length + ` FCS file(s) loaded`);
            }
        })
        .catch(err => {
            toast.error(" Problem reaching API. Check internet connection", {autoClose: 5000});
        }) 
        setLoading(false);
    }

    async function loadLocations(){
        await fetch(`${urlpath}/loadLocations`)
        .then(response => response.json())
        .then(function(response){
            if (response["status"]){
                setAllLocations(response["payload"]);
            }
        })
        .catch(err => {
            toast.error(" Problem reaching API. Check internet connection", {autoClose: 5000});
        }) 
    }
    
    useEffect(() => {
        loadLocations();
        loadFcsSelect();
        setExpanded("panel1");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        async function loadFilters(){
            await fetch(`${urlpath}/loadColumns/?fcs=${selectedFcs}`)
            .then(response => response.json())
            .then(function(response){
                if (response["status"]){
                    setAllColumns(response["payload"]);
                    setFcsSectionTitle(`Selected FCS:   ${selectedFcs}`);
                    setExpanded("panel2");
                    toast.info(response["payload"].length + ` Columns Loaded`);
                }
            })
            .catch(err => {
                toast.error(" Problem reaching API. Check internet connection", {autoClose: 5000});
            }) 
        }
        loadFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFcs]);
    

    const handleChange = panel => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const initiatePlot = () => {
        setLoading(true);
        fetch(`${urlpath}/plotGraph/?fcs=${selectedFcs}&allfcs=${JSON.stringify(allFcs)}&xval=${xval}&yval=${yval}&transformation=${transformation}`)
        .then(response => response.json())
        .then(function(response){
            if (response){
                var output = response.map(s => ({x:s[xval], y:s[yval]}));
                setDataToPlot(output);
                setGraphTitle("Scatter Plot: " + xval + " Vs. " + yval);
                setExpanded("panel3");
            }
            setLoading(false);
        })
        .catch(err => {
            console.log(err);
            setLoading(false);
            toast.error(" Problem reaching API. Check internet connection", {autoClose: 5000});
        }) 
    };

    function resetFilters(e){
        setDateFrom("");
        setDateTo("");
        setFcsType("");
        setLocation("");
        loadFcsSelect();        
    }

    function generateHeatMaps(){
        setLoading(true);
        fetch(`${urlpath}/generateHeatmap/?fcs=${selectedFcs}&allfcs=${JSON.stringify(allFcs)}&x1=${gateX1}&y1=${gateY1}&x2=${gateX2}&y2=${gateY2}&binwidth=${binwidth}`)
        .then(response => response.json())
        .then(function(response){
            if (response['status']){
                setGatedData(Object.values(response['payload']));
                setLineData(Object.values(response['linedata']));
                setLineDataKeys(Object.keys(response['linedata']));
                toast.info(" Gate heatmap & Line chart Generated");
                setExpanded("panel4");
                loadClusterImages();
            } else {
                toast.warn(response['message']);
            }
            setLoading(false);
        })
        .catch(err => {
            console.log(err);
            setLoading(false);
            toast.error(" Problem reaching API. Check internet connection", {autoClose: 5000});
        }) 
    }

    async function loadClusterImages(){
        // setClusterImage('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');
        // let sampl['svd'] = `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`
        // setClusterImage(sampl);
        let size = (gateX2-gateX1)*(gateY2-gateY1);
        await fetch(`${urlpath}/loadClusterPlots/?size=${size}&clusters=${clusters}`)
        .then(response => response.json())
        .then(function(response){
            if (response["status"]){
                setClusterImage(response["payload"]);
                toast.info(" Clusters Created");
            } else {
                toast.warn('Clusters taking longer than usual to create');
            }
        })
        .catch(err => {
            toast.error(" Problem reaching API. Check internet connection", {autoClose: 5000});
        }) 
    }


    return (
        <div className={"ChartingSection"}>
            <div className="PageTitleTop">
                <Typography variant="h4" component="h4" align="left" color="primary">
                FCS file analysis 
                </Typography>
            </div>
            {/* <div>
                <img src={`data:image/png;base64,${clusterImage}`} alt="Cluster - SVD" />
            </div> */}
            <ExpansionPanel expanded={expanded === 'panel1'} onChange={handleChange('panel1')} defaultExpanded>
            <ExpansionPanelSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1bh-content"
                id="panel1bh-header"
            >
                <Typography className={classes.heading}>{fcsSectionTitle}</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <Grid container spacing={3}>
                    <Grid container item xs={12} spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="body1" >
                            Filters:
                            </Typography>
                        </Grid>
                        <Grid item md={3} sm={6} xs={12}>
                            <TextField
                                id="datefrom"
                                label="From"
                                type="date"
                                variant="outlined"
                                value={dateFrom}
                                className={classes.textField}
                                //onChange={handleDateChange}
                                onChange={e => setDateFrom(e.target.value)}

                                InputLabelProps={{
                                    shrink: true,
                                }}
                                fullWidth
                                size={'small'}
                            />
                        </Grid>
                        <Grid item md={3} sm={6} xs={12}>
                            <TextField
                                id="dateto"
                                label="To"
                                type="date"
                                variant="outlined"
                                value={dateTo}
                                className={classes.textField}
                                onChange={e => setDateTo(e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                fullWidth
                                size={'small'}
                            />
                        </Grid>
                        <Grid item md={3} sm={6} xs={12}>
                            <CustomSelect 
                            data={[{
                                id: "Cancer",
                                name: "Cancer"
                            },
                            {
                                id: "No Cancer",
                                name: "No Cancer"
                            }]} 
                            placeholderText={'Type'}
                            selectSize={'small'}
                            onSelectChange={(value) => {
                                setFcsType(value);
                            }} 
                            />
                        </Grid>
                        <Grid item md={3} sm={6} xs={12}>
                            <CustomSelect 
                            data={allLocations} 
                            placeholderText={'Location'}
                            selectSize={'small'}
                            onSelectChange={(value) => {
                                setLocation(value);
                            }} 
                            />
                        </Grid>
                        <Grid item xs={12}>
                            
                            <Button 
                            variant="outlined"
                            size="medium" 
                            color="primary"
                            onClick={loadFcsSelect}
                            className={"btn-apply-analyze"}
                            disabled={
                                dateFrom.length === 0 && dateTo.length === 0 && fcsType.length === 0 && location.length === 0
                            }
                            >
                                {(loading && <CircularProgress size={24} className={classes.buttonProgress} />) || 'Apply' }
                            </Button>
                            <Button 
                            variant="outlined"
                            size="medium" 
                            color="secondary"
                            onClick={resetFilters}
                            className={"btn-reset-analyze"}
                            >
                                Reset
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid className={"space-analyze"} container item xs={12} spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="body1" >
                                Please Choose:
                            </Typography>
                        </Grid>
                        <Grid item xs={12} autoFocus>
                            <CustomSelect 
                            data={allFcs} 
                            placeholderText={'FCS-file'}
                            selectSize={'medium'}
                            onSelectChange={(value) => {
                                setSelectedFcs(value);
                            }} 
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                <ExpansionPanelSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel2bh-content"
                    id="panel2bh-header"
                    >
                    <Typography className={classes.heading}>Options</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails className={classes.details}>
                    <Grid container spacing={3} >
                        <Grid item xs={4}>
                        <CustomSelect 
                        data={allColumns} 
                        placeholderText={'X-Axis'}
                        selectSize={'small'}
                        onSelectChange={(value) => {
                            setXval(value);
                        }} 
                        />
                        </Grid>
                        <Grid item xs={4}>
                            <CustomSelect 
                            data={allColumns} 
                            placeholderText={'Y-Axis'}
                            selectSize={'small'}
                            onSelectChange={(value) => {
                                setYval(value);
                            }} 
                            
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <CustomSelect 
                            data={[{
                                id: "hlog",
                                name: "HLOG"
                            },
                            {
                                id: "glog",
                                name: "GLOG"
                            }]} 
                            placeholderText={'Transformation'}
                            selectSize={'small'}
                            onSelectChange={(value) => {
                                setTransformation(value);
                            }} 
                            />
                        </Grid>
                    </Grid>
                
                    {/* <div className={clsx(classes.column, classes.helper)}>
                        <Typography variant="caption">
                        Select your destination of choice
                        <br />
                        <a href="#secondary-heading-and-columns" className={classes.link}>
                            Learn more
                        </a>
                        </Typography>
                    </div> */}
                </ExpansionPanelDetails>
                <Divider />
                <ExpansionPanelActions>
                {/* <Button size="small">Cancel</Button> */}
                <Button 
                variant="outlined"
                size="medium" 
                color="primary"
                onClick={initiatePlot}
                // disabled={enablePlotButton}
                disabled={
                    xval.length === 0 || yval.length === 0
                }
                >
                    {(loading && <CircularProgress size={24} className={classes.buttonProgress} />) || 'Plot' }
                </Button>
                </ExpansionPanelActions>
            </ExpansionPanel>

            <ExpansionPanel expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
            <ExpansionPanelSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel3bh-content"
                id="panel3bh-header"
            >
                <Typography className={classes.heading}>{graphTitle}</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <Grid container>
                    <Grid item xs={12}>
                        <Scatter 
                        dataToPlot={dataToPlot}
                        title={title}
                        xval={xval}
                        yval={yval}
                        />
                    </Grid>
                    <Grid className={"space-analyze"} container item xs={12} spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="body1" >
                            Gates:
                            </Typography>
                        </Grid>
                        <Grid item sm={3} xs={6}>
                            <TextField
                                id="gateX1"
                                label="X1"
                                type="number"
                                variant="outlined"
                                value={gateX1}
                                className={classes.textField}
                                onChange={e => { setGateX1(e.target.value); setGateY1(e.target.value)}}
                                fullWidth
                                size={'small'}
                                InputProps={{
                                    inputProps: { 
                                        max: 200, min: 1 
                                    }
                                }}
                                // error
                                // required
                                // helperText={"Min: 1, Max: 200"}
                            />
                        </Grid>
                        <Grid item sm={3} xs={6}>
                            <TextField
                                id="gateY1"
                                label="Y1"
                                type="number"
                                variant="outlined"
                                value={gateY1}
                                className={classes.textField}
                                onChange={e => { setGateX1(e.target.value); setGateY1(e.target.value)}}
                                fullWidth
                                size={'small'}
                                InputProps={{
                                    inputProps: { 
                                        max: 200, min: 1 
                                    }
                                }}
                                // error
                                // required
                                // helperText={"Min: 1, Max: 200"}
                            />
                        </Grid>
                        <Grid item sm={3} xs={6}>
                            <TextField
                                id="gateX2"
                                label="X2"
                                type="number"
                                variant="outlined"
                                value={gateX2}
                                className={classes.textField}
                                onChange={e => { setGateX2(e.target.value); setGateY2(e.target.value)}}
                                fullWidth
                                size={'small'}
                                InputProps={{
                                    inputProps: { 
                                        max: 200, min: 1 
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item sm={3} xs={6}>
                            <TextField
                                id="gateY2"
                                label="Y2"
                                type="number"
                                variant="outlined"
                                value={gateY2}
                                className={classes.textField}
                                onChange={e => { setGateX2(e.target.value); setGateY2(e.target.value)}}
                                fullWidth
                                size={'small'}
                                InputProps={{
                                    inputProps: { 
                                        max: 200, min: 1 
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                id="binwidth"
                                label="Binwidth"
                                type="number"
                                variant="outlined"
                                value={binwidth}
                                className={classes.textField}
                                onChange={e => setBinwidth(e.target.value)}
                                fullWidth
                                size={'small'}
                                InputProps={{
                                    inputProps: { 
                                        max: 2000, min: 100 
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button 
                            variant="outlined"
                            size="medium" 
                            color="primary"
                            onClick={generateHeatMaps}
                            className={"btn-apply-analyze"}
                            autoFocus
                            disabled={
                                selectedFcs.length === 0 || xval.length === 0 || yval.length === 0 
                            }
                            >
                                {(loading && <CircularProgress size={24} className={classes.buttonProgress} />) || 'Generate Clusters' }
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
                {/* <ChartPlot 
                data={"is here"}
                /> */}
            </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
            <ExpansionPanelSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel4bh-content"
                id="panel4bh-header"
            >
                <Typography className={classes.heading}>{`Gated - (${gateX1},${gateY1}) : (${gateX2}, ${gateY2})`}</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
            <Grid container>
                <Grid item xs={12}>
                    <Heatmap 
                    gatedData={gatedData}
                    selectedFcs={selectedFcs}
                    gateX1={gateX1}
                    gateX2={gateX2}
                    gateY1={gateY1}
                    gateY2={gateY2}
                    />
                </Grid>
                <Grid item xs={12}>
                    <LineChart 
                    lineData={lineData}
                    lineDataKeys={lineDataKeys}
                    selectedFcs={selectedFcs}
                    gateX1={gateX1}
                    gateX2={gateX2}
                    gateY1={gateY1}
                    gateY2={gateY2}
                    />
                </Grid>
                <Grid item className={"cluster-analyze"} spacing={3} container xs={12}>
                    <Grid item container lg={6} xs={6}>
                    </Grid>
                    <Grid item container lg={6} xs={6}  alignContent={'flex-end'}>
                        <Grid item sm={3} xs={6}>
                            <TextField
                                id="clusters"
                                label="Clusters"
                                type="number"
                                variant="outlined"
                                value={clusters}
                                className={classes.textField}
                                onChange={e =>  setClusters(e.target.value)}
                                fullWidth
                                size={'small'}
                                InputProps={{
                                    inputProps: { 
                                        max: 200, min: 1 
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item sm={4} xs={6}>
                            <Button 
                            variant="outlined"
                            size="medium" 
                            color="primary"
                            onClick={loadClusterImages}
                            className={"btn-apply-analyze"}
                            autoFocus
                            disabled={
                                selectedFcs.length === 0 || xval.length === 0 || yval.length === 0 
                            }
                            >
                                {(loading && <CircularProgress size={24} className={classes.buttonProgress} />) || 'Re-Cluster' }
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item spacing={3} container xs={12}>
                    <Grid item lg={6} xs={12}>
                        <img src={`data:image/png;base64,${clusterImage['svd']}`} alt="Cluster - SVD" />
                    </Grid>
                    <Grid item lg={6} xs={12}>
                        <img src={`data:image/png;base64,${clusterImage['mds']}`} alt="Cluster - MDS" />
                    </Grid>
                </Grid>
            </Grid>
            </ExpansionPanelDetails>
            </ExpansionPanel>
        </div>
    );
}