"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface IdentityFilterProps {
  onComplete?: (city: string, type: string) => void
}

export function IdentityFilter({ onComplete }: IdentityFilterProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [isAnimating, setIsAnimating] = useState(false)

  const cities = ["全国", "北京", "上海", "广州", "深圳", "杭州", "家乡"]
  const companyTypes = ["国企", "中小厂", "初创", "小而美"]

  const handleCitySelect = (city: string) => {
    setSelectedCity(city)
    setIsAnimating(true)
    
    // 300ms 后切换到第二步
    setTimeout(() => {
      setStep(2)
      setIsAnimating(false)
    }, 300)
  }

  const handleTypeSelect = (type: string) => {
    setSelectedType(type)
    setIsAnimating(true)
    
    // 300ms 后显示完成状态
    setTimeout(() => {
      setIsAnimating(false)
      if (onComplete) {
        onComplete(selectedCity, type)
      }
    }, 300)
  }

  const handleViewJobs = () => {
    router.push(`/jobs?city=${selectedCity}&type=${selectedType}&edu=不限`)
  }

  const handleReset = () => {
    setStep(1)
    setSelectedCity("")
    setSelectedType("")
    setIsAnimating(false)
  }

  const getHeadline = () => {
    if (selectedCity && selectedType) {
      return `原来你是【${selectedCity}·${selectedType}】型选手！为你准备了 128 份精选岗位 →`
    }
    return "Hi，你是谁？点两下，工作来找你。"
  }

  return (
    <main className="screen-center">
      <h1 id="headline" className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12 transition-all duration-300">
        {getHeadline()}
      </h1>

      {/* Step 1: 选择城市/地区 */}
      <section 
        id="step1" 
        className={`step transition-all duration-300 ease-out ${
          step === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'
        }`}
      >
        <p className="sub text-lg text-gray-600 text-center mb-8">选择城市/地区</p>
        <div className="options grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {cities.map((city) => (
            <button
              key={city}
              data-value={city}
              onClick={() => handleCitySelect(city)}
              className={`identity-btn ${selectedCity === city ? 'selected' : ''}`}
              disabled={isAnimating}
            >
              {city}
            </button>
          ))}
        </div>
      </section>

      {/* Step 2: 选择公司类型 */}
      <section 
        id="step2" 
        className={`step transition-all duration-300 ease-out ${
          step === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
      >
        <p className="sub text-lg text-gray-600 text-center mb-8">选择公司类型</p>
        <div className="options grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {companyTypes.map((type) => (
            <button
              key={type}
              data-value={type}
              onClick={() => handleTypeSelect(type)}
              className={`identity-btn ${selectedType === type ? 'selected' : ''}`}
              disabled={isAnimating}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      {/* 操作按钮 */}
      <div className={`flex flex-col sm:flex-row gap-4 justify-center mt-12 transition-all duration-300 ${
        selectedCity && selectedType ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
      }`}>
        <button 
          id="cta" 
          onClick={handleViewJobs}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        >
          立即查看
        </button>
        <button 
          id="reset" 
          onClick={handleReset}
          className="text-indigo-600 hover:text-indigo-700 font-medium py-4 px-8 rounded-full text-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          改定位
        </button>
      </div>
    </main>
  )
} 