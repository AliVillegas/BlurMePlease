<script>
  let chosenImage = null;
  function refreshPage() {
    window.location.reload();
  }

  function updateImage(e) {
    chosenImage = e.target.files[0];
  }
  function doSomeMagic() {
    console.log("MAGIC");
    let image = new Image();
    image.src = URL.createObjectURL(chosenImage);
    image.onload = function () {
      console.log(image);
      if (image) {
        manipulateImage(image);
      }
    };
  }

  function manipulateImage(i) {
    let mat = cv.imread(i);
    let l = 5;
    let u = 6;

    cv.cvtColor(mat, mat, cv.COLOR_BGR2GRAY);
    let gaussianBlurred = new cv.Mat();
    let ksize = new cv.Size(5, 5);

    document.getElementById("downloadButton").style.display = "block";

    cv.GaussianBlur(mat, gaussianBlurred, ksize, 0, 0, cv.BORDER_DEFAULT);
    cv.imshow("outputImage", gaussianBlurred);
    let secondGrayPass = new cv.Mat();
    cv.cvtColor(gaussianBlurred, secondGrayPass, cv.COLOR_BGR2GRAY);
    cv.imshow("outputImage", secondGrayPass);
    mat.delete();
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
      <li class="nav-item">
        <a class="textPurple font" href="https://www.patreon.com/alivillegas"
          >Donate</a
        >
      </li>
    </ul>
  </div>
</nav>
<div class="mx-auto d-block text-center my-5 font">
  <h3>Simply choose a PNG file, click the button and watch some magic</h3>
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
  <button class="begoneBtn borderPurple my-3" on:click={doSomeMagic}>
    <span style="margin-bottom: 10;"> Begone! </span>
  </button>
</div>
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
  <img id="input_img" width="500" height="500" alt="" style="display:none" />
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
