import { pymLoader } from '../embeds/pym';
import {
  select,
  selectAll,
  datum
} from 'd3-selection';
import { debounce } from 'lodash';
import data from '../../../data/data.json';
import '../map';

// a reference to the default graphic container, change if needed
const container = select('#graphic');

// a helper function to clear the container of its contents
const clearContainer = () => container.html('');

// a helper function to grab the container's width
const getFrameWidth = () => container.node().offsetWidth;
const routes = data.usroutes;
const origins = data.origins;
const airports = data.usairports;
console.log(data)
console.log(airports)
const destinations = data.destinations;

let mapChart = null;
let card = null;
let carrier = null;
let origin = null;
let destination = null;
let selectedRoutes = null;

let possibleCarriers = null;
let possibleOrigins = null;
let possibleDestinations = null;
let possibleAirports = null;

const blankCarrier = {'REPORTING_CARRIER': '---', 'Name': '---'};
const blankAirport = {'Name': '---', 'City': '---', 'IATA': '---'};

const resize = () => {
    mapChart.resize();
    mapChart.render();
}

/**
 * This function is called to render a graphic by Pym.js. The frame's width and
 * a reference to the Pym instance is provided.
 *
 * @param  {Object} pymChild         A reference to the iframe's Pym instance
 * @return {void}
 */
export default function renderGraphic(pymChild) {
  // uncomment these two lines if you're creating a coded graphic
  clearContainer(); // clears the container
  const frameWidth = getFrameWidth(); // calcuates the width on each render
  console.log(data);
  mapChart = select("#graphic").datum(data).map();
  window.addEventListener('resize', debounce(resize, 150));

}

pymLoader(renderGraphic).catch(console.error);

const cardDropdown = document.getElementById('card-dropdown');
const carrierDropdown = document.getElementById('carrier-dropdown');
const originDropdown = document.getElementById('origin-dropdown');
const destinationDropdown = document.getElementById('destination-dropdown');

// add change listener
cardDropdown.addEventListener('change', event => {

  const value = event.target.value;

  // find the element that matches (value has # in it, so use querySelector instead)
  //const match = document.querySelector(value);
});

carrierDropdown.addEventListener('change', event => {

  const el = event.target;
  const value = el.value;
  carrier = value;
  console.log(carrier)
  selectedRoutes = routes.filter(d => (origin != null ? d['ORIGIN'] == origin : true) &&
    (destination != null ? d['DEST'] == destination : true) &&
    (carrier != null ? d['OPERATING_CARRIER'] == carrier : true));

  data.usroutes = selectedRoutes;
  

  possibleOrigins = [...new Set(selectedRoutes.map(d => d.ORIGIN))];
  possibleDestinations = [...new Set(selectedRoutes.map(d => d.DEST))];
  possibleAirports = [...possibleOrigins, ...possibleDestinations];

console.log(airports)
  data.origins = airports.filter(d => possibleOrigins.includes(d['IATA']));
  data.destinations = destinations.filter(d => possibleDestinations.includes(d['IATA']));
  data.usairports = airports.filter(d => possibleAirports.includes(d['IATA']));

  // console.log(possibleOrigins)
  // console.log(possibleDestinations)
  console.log([blankAirport, ...data.origins])
  select(originDropdown).selectAll("option")
    .data([blankAirport, ...data.origins])
    .join(
      enter => enter.append("option")
        .attr("value", d => {
          console.log(d)
          return d.IATA
        })
        .text(d => d.Name),
      update => update
        .attr("value", d => d.IATA)
        .text(d => d.Name),
      exit => exit
        .remove()
    );

  
  select(destinationDropdown).selectAll("option")
    .data([blankAirport, ...data.destinations])
    .join(
      enter => enter.append("option")
        .attr("value", d => d.IATA)
        .text(d => d.Name),
      update => update
        .attr("value", d => d.IATA)
        .text(d => d.Name),
      exit => exit
        .remove()
      );


  
  mapChart.data(data);
  // find the element that matches (value has # in it, so use querySelector instead)
  //const match = document.querySelector(value);
});

originDropdown.addEventListener('change', event => {
  
  const el = event.target;
  const value = el.value;
  origin = value;

  selectedRoutes = routes.filter(d => (origin != null ? d['ORIGIN'] == origin : true) && 
  (destination != null ? d['DEST'] == destination : true) &&
  (carrier!= null ? d['OPERATING_CARRIER'] == carrier : true));

  data.usroutes = selectedRoutes;
  
  mapChart.data(data);
  
  // find the element that matches (value has # in it, so use querySelector instead)
  //const match = document.querySelector(value);
});

destinationDropdown.addEventListener('change', event => {

  const el = event.target;
  const value = el.value;
  destination = value;

  selectedRoutes = routes.filter(d => (origin != null ? d['ORIGIN'] == origin : true) &&
    (destination != null ? d['DEST'] == destination : true) &&
    (carrier != null ? d['OPERATING_CARRIER'] == carrier : true));
  
  data.usroutes = selectedRoutes;
  
  mapChart.data(data);
});