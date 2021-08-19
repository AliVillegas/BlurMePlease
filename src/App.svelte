<script>
  import { Jumper } from "svelte-loading-spinners";

  let chosenImage = null;
  let showSpinner = false;
  let blurStrength = 50;
  let fileTooBig = false;
  function refreshPage() {
    window.location.reload();
  }

  function updateImage(e) {
    chosenImage = e.target.files[0];
  }
  function doSomeMagic() {
    fileTooBig = false;
    showSpinner = true;
    console.log("MAGIC");
    let image = new Image();
    if (chosenImage === null) {
      showSpinner = false;
      return;
    } else {
      if (chosenImage.size > 2097152) {
        fileTooBig = true;
        this.value = "";
        showSpinner = false;
        return;
      }
    }
    image.src = URL.createObjectURL(chosenImage);
    image.onload = function () {
      if (image) {
        manipulateImage(image);
      }
    };
  }

  function manipulateImage(i) {
    let mat = cv.imread(i);
    document.getElementById("downloadButton").style.display = "block";
    let gaussianBlurred = new cv.Mat();
    let strength = parseFloat(blurStrength * 2);
    if (!(strength % 2)) {
      strength = strength + 1;
    }
    console.log("sizes", strength);

    let ksize = new cv.Size(strength, strength);
    cv.GaussianBlur(mat, gaussianBlurred, ksize, cv.BORDER_DEFAULT);
    cv.imshow("outputImage", gaussianBlurred);
    window.scrollTo(0, document.body.scrollHeight);
    showSpinner = false;
    //delete matrices
    mat.delete();
    gaussianBlurred.delete();
  }

  function download() {
    var link = document.createElement("a");
    link.download = "noBackground.png";
    link.href = document.getElementById("outputImage").toDataURL();
    link.click();
  }
</script>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Space+Grotesk&display=swap"
    rel="stylesheet"
  />
  <script async src="js/opencv.js"></script>
</svelte:head>

<nav class="navbar navbar-expand-lg navbar-light borderBottomPurple mb-3">
  <img
    on:click={refreshPage}
    style="cursor:pointer"
    src="images/Logo.png"
    width="150"
    alt=""
  />
  <button
    class="navbar-toggler"
    type="button"
    data-toggle="collapse"
    data-target="#navbarSupportedContent"
    aria-controls="navbarSupportedContent"
    aria-expanded="false"
    aria-label="Toggle navigation"
  >
    <span class="navbar-toggler-icon" />
  </button>

  <div class="collapse navbar-collapse" id="navbarSupportedContent">
    <ul class="navbar-nav mx-auto my-2 p-3 ">
      <li class="nav-item mx-auto p-2">
        <a class="textPurple font" href="https://www.patreon.com/alivillegas"
          >How it works</a
        >
      </li>
      <li class="nav-item mx-auto p-2">
        <a class="textPurple font" href="">About</a>
      </li>
      <li class="nav-item mx-auto p-2">
        <a class="textPurple font" href="">Donate</a>
      </li>
    </ul>
  </div>
</nav>
<div class="mx-auto d-block text-center my-5 font">
  <h3 class="text-right">
    1. Simply choose a PNG or JPG file. (maximum 2MB) <p />
    2. Select blurriness strength (100 is extra blurry)
    <p />
    3. Click Blur! and hopefully watch some magic
  </h3>
  {#if fileTooBig}
    <h1 class="text-right my-5" style="color:rebeccaPurple">
      That file is too big (╯°□°）╯︵ ┻━┻
    </h1>
  {/if}
</div>
<div class="mx-auto d-block text-center my-3">
  <input
    id="fileInput"
    class="text-center mx-auto"
    type="file"
    style="width:50vw;height:5vw; min-height: 50px;"
    name="upfile"
    accept="image/png,image/jpeg"
    on:change={(e) => updateImage(e)}
    required
  />
  <p />
  <div class="slidecontainer font">
    <input
      style="width:50vw;background-color:rebeccapurple"
      type="range"
      min="1"
      max="100"
      bind:value={blurStrength}
      on:change={console.log(blurStrength)}
      class="slider"
      id="myRange"
    />
    <p />
    Strength:
    <h4 class="text-right">
      {blurStrength}
    </h4>
  </div>
  <p />
  <button class="begoneBtn borderPurple my-3" on:click={doSomeMagic}>
    <span style="margin-bottom: 10;"> Blur! </span>
  </button>
</div>
{#if showSpinner}
  <div class="row">
    <div class="col-5" />
    <div class="col-4 mx-auto text-center">
      <Jumper size="90" color="#7a0bea" unit="px" duration="2s" />
    </div>
    <div class="col-3" />
  </div>
{/if}

<div class="mx-auto d-block text-center my-5">
  <button
    class="begoneBtn borderPurple my-5 mx-auto "
    style="display:none"
    id="downloadButton"
    on:click={download}
  >
    <span style="margin-bottom: 10;"> Download! </span>
  </button>
</div>
<div class="mx-auto d-block text-center my-3">
  <canvas id="outputImage" width="500" />
  <img id="input_img" alt="" style="display:none" />
</div>

<style>
  .font {
    font-family: "Space Grotesk", sans-serif;
  }
  .textPurple {
    color: rebeccapurple;
  }
  .borderPurple {
    border: 2px solid rebeccapurple;
    border-radius: 10px;
  }
  .borderBottomPurple {
    border-bottom: 2px solid rebeccapurple;
  }
  .begoneBtn {
    background-color: transparent;
    width: 200px;
    height: 40px;
    line-height: 40px;

    padding-bottom: 50px !important;
    font-size: 18px;
    font-family: sans-serif;
    text-decoration: none;
    letter-spacing: 10px;
    text-align: center;
    position: relative;
    transition: all 0.35s;
  }
  .begoneBtn:after {
    position: absolute;

    transition: all 0.5s;
  }
  .begoneBtn:hover {
    color: black;
    border-radius: 50px;
  }

  .begoneBtn:hover:after {
    width: 100%;
    border-radius: 100px;
  }
</style>
