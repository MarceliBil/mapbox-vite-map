import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';

interface Location {
    name: string;
    description: string;
    website: string;
    vendor_type: string;
    latitude: number;
    longitude: number;
    loc_url: string;
    continent: string;
}

let locations: Location[] = [];
let currentMarkerIndex: number;

//GLOBAL VARIABLRS
const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const customStyleId = import.meta.env.VITE_MAPBOX_CUSTOM_STYLE;
const locationsUrl = import.meta.env.VITE_MAPBOX_LOCATIONS;

// HTML ELEMENTS
const mapWrapper = document.querySelector('#js-map-wrapper');
const sidebar = document.querySelector('#js-sidebar')!;
const nextBtn = sidebar.querySelector('#js-next');
const prevBtn = sidebar.querySelector('#js-prev');
const closeBtn = sidebar.querySelector('#js-close');

//SIDEBAR ELEMENTS
const locationStaticImage = sidebar.querySelector('#js-static-img') as HTMLImageElement;
const locationName = sidebar.querySelector('#js-name')!;
const locationContinent = sidebar.querySelector('#js-continent')!;
const locationDescription = sidebar.querySelector('#js-description')!;
const locationWebsite = sidebar.querySelector('#js-website') as HTMLAnchorElement;
const locationUrl = sidebar.querySelector('#js-url')!;
const locationCurrentIndex = sidebar.querySelector('#js-current-index')!;


function onSidebarOpen() {
    sidebar.classList.add('is-shown');
}


function onSidebarClose() {
    sidebar.classList.remove('is-shown');
    
    const activeMarker = mapWrapper?.querySelector('.mapboxgl-marker.is-active');
    activeMarker?.classList.remove('is-active');
}


function onSidebarUpdate(location: Location) {
    if (sidebar) {
        const zoom = 16;
        const staticMapUrl = `https://api.mapbox.com/styles/v1/${customStyleId}/static/${location.longitude},${location.latitude},${zoom},0,0/640x340?access_token=${token}`;
        
        locationStaticImage.src = staticMapUrl;
        locationName.textContent = location.name;
        locationContinent.textContent = location.continent;
        locationDescription.textContent = location.description;
        locationWebsite.href = location.website;
        locationUrl.textContent = location.website;
        locationCurrentIndex.textContent = (currentMarkerIndex + 1).toString();
    }
}


function setActiveMarker(index: number) {
    const activeMarker = mapWrapper?.querySelector('.mapboxgl-marker.is-active');
    activeMarker?.classList.remove('is-active');

    const marker = document.querySelector(`[data-index="${index}"]`);
    marker?.classList.add('is-active');
    currentMarkerIndex = index;
}


export default function Map() {
    mapboxgl.accessToken = token;
    
    const map = new mapboxgl.Map({
        container: 'map',
        style: `mapbox://styles/${customStyleId}`,
        center: [-21.5, 34.5],
        zoom: 2.1,
    });


    function showPreviousMarker() {
        if (currentMarkerIndex > 0) {
            currentMarkerIndex--;
            onSidebarUpdate(locations[currentMarkerIndex]);
            setActiveMarker(currentMarkerIndex);
        }
    }


    function showNextMarker() {
        if (currentMarkerIndex < locations.length - 1) {
            currentMarkerIndex++;
            onSidebarUpdate(locations[currentMarkerIndex]);
            setActiveMarker(currentMarkerIndex);
        }
    }


    closeBtn?.addEventListener('click', onSidebarClose);


    mapWrapper?.addEventListener('click', (e)=>{
        const element = (e.target as HTMLElement);

        if (!element.classList.contains('mapboxgl-marker') &&
            !element.classList.contains('sidebar') &&
            !element.closest('#js-sidebar')?.classList.contains('sidebar')) {
            onSidebarClose();
        }
    })


    fetch(locationsUrl)
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.text();
        })
        .then((tsvData) => {
            const rows = tsvData.split('\n');

            const data = rows.map((row) => {
                const [name, description, website, vendor_type, latitude, longitude, loc_url, continent] = row.split('\t');
                return { name, description, website, vendor_type, latitude: parseFloat(latitude), longitude: parseFloat(longitude), loc_url, continent };
            });

            if (data.length > 0 && data[0].name) data.shift();

            locations = data.slice(0, 20).sort((a, b) => a.longitude - b.longitude);

            addMarkersToMap(locations, map);

            sidebar!.querySelector('#js-total-index')!.textContent = (locations.length).toString();

            if (nextBtn && prevBtn) {
                nextBtn.addEventListener('click', showNextMarker);
                prevBtn.addEventListener('click', showPreviousMarker);
            }
        })
        .catch((error) => {
            console.error('Fetch error:', error);
        });
}


function addMarkersToMap(locations: Location[], map: mapboxgl.Map) {
    locations.forEach((location: Location, index: number) => {
        const marker = new mapboxgl.Marker()
            .setLngLat([location.longitude, location.latitude])
            .addTo(map);

        marker.getElement().addEventListener('click', () => {
            setActiveMarker(index);
            onSidebarUpdate(location); 
            onSidebarOpen();
            
        });

        marker.getElement().setAttribute('data-index', index.toString());
    });
}
