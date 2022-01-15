import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Geolocation } from '@awesome-cordova-plugins/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@awesome-cordova-plugins/native-geocoder/ngx';
import { ToastService } from '../services/toast.service';
import { HttpClient } from "@angular/common/http";
declare var google;
@Component({
  selector: 'app-home-map',
  templateUrl: './home-map.page.html',
  styleUrls: ['./home-map.page.scss'],
})
export class HomeMapPage implements OnInit {

  @ViewChild("map", { static: false }) mapElement: ElementRef;
  map: any;
  address: string;
  searchAddress: string;
  latitude: number = 12;
  longitude: number= 12;

  marker: any;
  constructor(
    private geolocation: Geolocation, 
    private nativeGeocoder: NativeGeocoder,
    private toast: ToastService,
    private http: HttpClient,
    ) { }

  ngOnInit() {
  }

  async locateMe() {
    await this.geolocation.getCurrentPosition().then((resp) => {
      console.log(resp)
      this.latitude = resp.coords.latitude
      this.longitude = resp.coords.longitude

      let latLng = new google.maps.LatLng(
        this.latitude,
        this.longitude
      );
      console.log(latLng);
      this.placeMarker(latLng);
      this.toast.SuccessToast('Navigating to Your Current Location',2000);

    }).catch((error) => {
      this.toast.ErrorToast('Your Location Not Found',2000);
      console.log('Error getting location', error);
    });
  }
  async ionViewWillEnter() {
    // await this.locateMe();
    let latLng = new google.maps.LatLng(
      this.latitude,
      this.longitude
    );
    let mapOptions = {
      center: latLng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };
    this.getAddressFromCoords(
      this.latitude,
      this.longitude
    );
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
    this.locateMe();
    this.map.addListener("dragend", () => {
      this.latitude = this.map.center.lat();
      this.longitude = this.map.center.lng();

      this.getAddressFromCoords(this.map.center.lat(), this.map.center.lng());
      this.placeMarker(this.map.center);
    });

    this.map.addListener("click", (event) => {
      this.placeMarker(event.latLng);
      console.log(event);
    });

  }
  placeMarker(location) {
    console.log(location);

    this.latitude = location.lat();
    this.longitude = location.lng();

    this.getAddressFromCoords(location.lat(), location.lng());

    if (this.marker == undefined) {
      const icon = {
        url: '../../assets/marker.png', // image url
        scaledSize: new google.maps.Size(50, 50), // scaled size
      };

      this.marker = new google.maps.Marker({
        position: location,
        map: this.map,
        animation: google.maps.Animation.DROP,
        icon: icon
      });
    } else {
      this.marker.setPosition(location);
    }
    this.map.setCenter(location);
  }

  getAddressFromCoords(lattitude, longitude) {
    console.log("getAddressFromCoords " + lattitude + " " + longitude);
    let options: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 5,
    };

    this.nativeGeocoder
      .reverseGeocode(lattitude, longitude, options)
      .then((result: NativeGeocoderResult[]) => {
        this.address = "";
        let responseAddress = [];
        for (let [key, value] of Object.entries(result[0])) {
          if (value.length > 0) responseAddress.push(value);
        }
        responseAddress.reverse();
        for (let value of responseAddress) {
          this.address += value + ", ";
        }
        this.address = this.address.slice(0, -2);
      })
      .catch((error: any) => {
        this.address = "Address Not Available!";
      });
  }


  searchLocation() {
    console.log(this.searchAddress);
    this.searchApi(this.searchAddress);
  }

  searchApi(query) {
    const url = 'https://api.geoapify.com/v1/geocode/autocomplete?text=' + query + '&limit=3&apiKey=dcb06cb71c704af39e964e8ee6f2dbb1';
    this.http.get(url).subscribe(data => {
      let result = data as any;
      if (result.features.length) {
        let totalAddress = result.features[0].properties;
        this.placeMarker(new google.maps.LatLng({ lat: totalAddress.lat, lng: totalAddress.lon }));
        // $('#p_address_map').val(totalAddress.formatted);

      }
    });
  }

}
