const { getImageUrlFromDB } = require('./sonnet4_api.js');

async function testDB() {
  try {
    console.log("DB 연결 테스트 중...");
    
    // 제공된 furniture_id로 테스트
    const furnitureId = "bb07d86e-678c-4aa8-ac37-f1fdae71a5ec"; // Albini Ottoman stool
    const imageUrl = await getImageUrlFromDB(furnitureId);
    
    console.log("성공! 이미지 URL:", imageUrl);
  } catch (error) {
    console.error("DB 연결 실패:", error.message);
  }
  
  process.exit(0);
}

testDB();