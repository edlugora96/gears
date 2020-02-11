/*
  # z1 = [16, 50]
  # rpm = [500, 5000]

  # tesionMaterial = [2000, 16000]

  # tao = [0.001, 0.999] =>Math.random()

  # angPresion = 20

  # gama = [10, 8, 20] [normal, media, alta]

  # coefiSeguridad = [3, 5.5, 6] [normal, media, alta]

  # torque = [1000, 10000]


*/
const express = require("express");
const app = express();

const rand = (min, max, noFloor) =>
  noFloor
    ? Math.floor((Math.random() * (max - min) + min) * 1000) / 1000
    : Math.floor(Math.random() * (max - min)) + min;
const watts = hp => Math.floor(hp * 745.7 * 1000) / 1000;

const radSeg = rpm => Math.floor(rpm * 0.104719755 * 1000) / 1000;

const Y = [10, 8, 20];
const YName = ["normal", "media", "alta"];
const S = [3, 5.5, 6];
const SName = ["normal", "media", "alta"];
const angPresion = 20;

html = `<table style="
    text-align: center;
    border: 1px solid;
    padding: 0.5rem;
    margin: 1rem auto;
">
<tr>
  <th style="
    padding: 0.5em;
    border: 0.5px solid;
">Z1</th>
  <th style="
    padding: 0.5em;
    border: 0.5px solid;
">RPM</th>
  <th style="
    padding: 0.5em;
    border: 0.5px solid;
">Tmax (Mpa)</th>
  <th style="
    padding: 0.5em;
    border: 0.5px solid;
">Pot (hp)</th>
  <th style="
    padding: 0.5em;
    border: 0.5px solid;
">Pot (w)</th>
  <th style="
    padding: 0.5em;
    border: 0.5px solid;
">Torque (N.m)</th>
  <th style="
    padding: 0.5em;
    border: 0.5px solid;
">Presicion</th>
  <th style="
    padding: 0.5em;
    border: 0.5px solid;
">Condicion Desfavorable</th>
  <th style="
    padding: 0.5em;
    border: 0.5px solid;
">Modulo (mm)</th>
  <th style="
    padding: 0.5em;
    border: 0.5px solid;
">Ft (N)</th>
</tr>
`;

const pasoModulo = (id, max) => {
  const z1 = rand(16, 50);
  const rpm = rand(500, 5000);
  const tesionMaterial = rand(1, 10, true);
  const hp = rand(0.25, 5);
  const potencia = watts(hp);

  // const mFlector = (potencia * 2 * 3.14) / (rpm * 60);
  const torque = Math.floor((potencia / radSeg(rpm)) * 1000) / 1000;

  // console.log({
  //   rpm,
  //   radSeg: radSeg(rpm),
  //   m1: potencia / radSeg(rpm),
  //   torque
  // });
  const ysle = rand(0, 3);
  const longThot = Y[ysle];
  const longThotName = YName[ysle] + " (Y=" + Y[ysle] + ")";

  const ssle = rand(0, 3);
  const security = S[ssle];
  const securityName = SName[ssle] + " (Er=" + S[ssle] + ")";

  const factorForma = 0.154 - 0.912 / z1;

  let ND = 0.7;
  const numerador = 2 * torque * security;
  const denominador = z1 * 3.14 * factorForma * longThot * tesionMaterial * ND;

  const preModulo = numerador / denominador;

  let modulo1P = Math.pow(preModulo, 1 / 3) * 1000;

  let modulo = modulo1P;

  const cModulo = (modulo1P, ND) => {
    const vPrimaNumerador = 3.14 * rpm * modulo1P * z1;
    const vPrimaDenominador = 60000;

    const vPrima = vPrimaNumerador / vPrimaDenominador;

    const ND2P = 5.6 / (5.6 + Math.pow(vPrima, 1 / 2));
    if (ND2P < ND - 0.001 || ND2P > ND + 0.001) {
      let modulo2P = modulo1P * Math.pow(ND / ND2P, 1 / 3);
      if (modulo2P > modulo1P - 0.001 && modulo2P < modulo1P + 0.001) {
        modulo = modulo2P;
      } else {
        cModulo(modulo2P, ND2P);
      }
    } else {
      html =
        html +
        `
        <tr>
          <td style="
    padding: 0.5em;
    border: 0.5px solid;
">${z1}</td>
          <td style="
    padding: 0.5em;
    border: 0.5px solid;
">${rpm}</td>
          <td style="
    padding: 0.5em;
    border: 0.5px solid;
">${tesionMaterial}</td>
          <td style="
    padding: 0.5em;
    border: 0.5px solid;
">${hp}</td>
          <td style="
    padding: 0.5em;
    border: 0.5px solid;
">${potencia}</td>
          <td style="
    padding: 0.5em;
    border: 0.5px solid;
">${torque}</td>
          <td style="
    padding: 0.5em;
    border: 0.5px solid;
">${longThotName}</td>
          <td style="
    padding: 0.5em;
    border: 0.5px solid;
">${securityName}</td>
          <td style="
    padding: 0.5em;
    border: 0.5px solid;
">${Math.floor(modulo * 1000) / 1000}</td>
          <td style="
    padding: 0.5em;
    border: 0.5px solid;
">${Math.floor((torque / ((modulo * z1) / 2000)) * 1000) / 1000}</td>
        </tr>
      `;
    }
  };

  cModulo(modulo1P, ND);
};

app.get("/", function(req, res) {
  pasoModulo();
  res.send(html);
});

app.listen(process.env.PORT || 3000, err => {
  if (err) throw err;
  console.log("> Ready on http://localhost:3000");
});
