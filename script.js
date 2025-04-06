const themeToggle = document.querySelector(".toggle-theme");
const promptBtn = document.querySelector(".prompt-btn");
const generateBtn = document.querySelector(".generate-btn");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallary-grid");
const API_KEY = "API_KEY";

const examplePrompts = [
    "A magic forest with glowing plants and fairy homes among giant mushrooms",
    "An old steampunk airship floating through golden clouds at sunset",
    "A future Mars colony with glass domes and gardens against red mountsins",
    "A dragon sleeping on gold coins in a crystal cave",
    "An underwater kingdom with merppeople and glowing coral buildings",
    "A floating island with waterfalls pouring into clouds below",
    "A witch's cottage in fall with magic herbs in the garden",
    "A robot painting in a sunny studio with art supplies around it",
    "A magical library with floating glowing books and spiral staircases",
    "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
];
(()=>{
   const savedTheme = localStorage.getItem("theme");
   const systemPrefersDark = window.matchMedia("(prefer-color-scheme)").matcher;
   const isDarkTheme = savedTheme === "dark"||(!savedTheme && systemPrefersDark)
   document.body.classList.toggle("dark-theme",isDarkTheme);
   themeToggle.querySelector("i").className=isDarkTheme?"fa-solid fa-sun":"fa-solid fa-moon";

})();

const toggleTheme = () => {
   const isDarkTheme = document.body.classList.toggle("dark-theme");
   localStorage.setItem("theme",isDarkTheme?"dark":"light");
   themeToggle.querySelector("i").className=isDarkTheme?"fa-solid fa-sun":"fa-solid fa-moon";
}

const getImageDimensions = (aspectRatio, baseSize = 512) => {
    console.log("aspectRatio:", aspectRatio, "Type:", typeof aspectRatio); 

    if (typeof aspectRatio !== "string") {
        console.error("Error: aspectRatio is not a string");
        return { width: 0, height: 0 }; 
    }

    if (!aspectRatio.includes("/")) {
        console.error("Error: Invalid aspect ratio format");
        return { width: 0, height: 0 };
    }

    const [width, height] = aspectRatio.split("/").map(Number);

    if (isNaN(width) || isNaN(height)) {
        console.error("Error: aspectRatio contains invalid numbers");
        return { width: 0, height: 0 };
    }

    const scalarFactor = baseSize / Math.sqrt(width * height);
    let calculatedWidth = Math.round(width * scalarFactor);
    let calculatedHeight = Math.round(height * scalarFactor);

    calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

    return { width: calculatedWidth, height: calculatedHeight };
};

const updateImageCard = (imgIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-cards-${imgIndex}`);

    if (!imgCard) return;
    imgCard.classList.remove("loading");
    imgCard.innerHTML = `<img src="${imgUrl}" class="result-img">
                        <div class="img-overlay">
                            <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
                                <i class="fa-solid fa-download"></i>
                            </a>
                        </div>`;
};

const generateImage = async (selectedModel,imageCount,aspectRatio,promptText) => {
   const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;

   const { width,height } =  getImageDimensions(aspectRatio);
   generateBtn.setAttribute("disabled","true");

   const imagePromises = Array.from({length:imageCount},async(_,i)=>{
   try{
    const response = await fetch(MODEL_URL,{
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "x-use-cache":"false",
        },
        method: "POST",
        body: JSON.stringify({
            inputs:promptText,
            parameter : {width,height},
            option:{wait_for_model:true,user_cache:false},
        }),
    });
    if(!response.ok) throw new Error((await response.json())?.error);
    const result = await response.blob();
    updateImageCard(i,URL.createObjectURL(result));
    console.log(result);
   }catch(error){
          console.log(error);
          const imgCard = document.getElementById(`img-cards-${i}`);
          imgCard.classList.replace("loading","error");
          imgCard.querySelector(".status-text").textContent = "Generation failed! Check console for more details.";
   }
})
await Promise.allSettled(imagePromises);
generateBtn.removeAttribute("disabled");
};

const createImageCards = (selectedModel,imageCount,aspectRatio,promptText)=>{
    gridGallery.innerHTML = "";
 for(let i=0;i<imageCount;i++){
  gridGallery.innerHTML += `<div class="img-cards loading" id="img-cards-${i}" style="aspect-ratio:${aspectRatio}">
                        <div class="status-container">
                            <div class="spinner"></div>
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <p class="status-text">Generating...</p>
                        </div>
                    </div>`;
 }
 generateImage(selectedModel,imageCount,aspectRatio,promptText);
}

const handleFormSubmit = (e) => {
    e.preventDefault();
    const selectedModel = modelSelect.value;
    const imageCount=  parseInt(countSelect.value) ||1;
    const aspectRatio = ratioSelect.value ||"1/1";
    const promptText = promptInput.value.trim();
    createImageCards(selectedModel,imageCount,aspectRatio,promptText);
}

promptBtn.addEventListener("click",()=>{
    const prompt = examplePrompts[Math.floor(Math.random()*examplePrompts.length)];
    promptInput.value = prompt;
    promptInput.focus();
});

promptForm.addEventListener("submit",handleFormSubmit);
themeToggle.addEventListener("click",toggleTheme);
