import React, { Component } from "react";

import classnames from "classnames";

import Loading from "components/Loading";
import Panel from "components/Panel";
//Import axios into the Dashboard.js file.
import axios from "axios";

import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay,
} from "helpers/selectors";

import { setInterview } from "helpers/reducers";

const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews,
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot,
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay,
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay,
  },
];

class Dashboard extends Component {
  //   An empty array of days
  // An empty object for appointments
  // An empty object for interviewers
  // Change loading to true

  // 3. State updates are asynchronous
  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {},
  };

  selectPanel(id) {
    this.setState((previousState) => ({
      focused: previousState.focused === null ? id : null,
    }));
  }
  //adding the local storage to the dashboard
  // Add the componentDidMount and componentDidUpdate lifecycle methods to the Dashboard component.
  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    if (focused) {
      this.setState({ focused });
    }

    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers"),
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data,
      });
    });
    //Use the process.env.REACT_APP_WEBSOCKET_URL environment variable as the URL.
    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState((previousState) =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };
  }
  //adding the local storage to the dashboard
  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      // We use the JSON.stringify function to convert our values before writing them to the localStorage. When we get the values out of storage, we use the JSON.parse function to convert the string back to JavaScript values. This process of serialization allows us to save more complex data types in localStorage.
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }
  //Close the socket using the instance variable that holds the reference to the connection.
  componentWillUnmount() {
    this.socket.close();
  }

  render() {
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused,
    });

    if (this.state.loading) {
      return <Loading />;
    }

    const panelList = data
      .filter(
        (panel) =>
          this.state.focused === null || this.state.focused === panel.id
      )
      //mapping through our data to generate panels
      .map((panel) => (
        <Panel
          key={panel.id}
          label={panel.label}
          value={panel.getValue(this.state)}
          onSelect={() => this.selectPanel(panel.id)}
        />
      ));

    return <main className={dashboardClasses}> {panelList} </main>;
  }
}

export default Dashboard;
